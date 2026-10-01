import "./tracing.js"; // side effects: registers the OTel exporter, if configured
import * as http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import * as crypto from "node:crypto";
import type { ModelMessage } from "ai";
import { config, missingModelVars } from "./config.js";
import { runTurn } from "./agent.js";
import { traceTurn } from "./tracing.js";

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

// This endpoint carries one sentence per request and nothing else — no
// conversation history, no attachments. A generous cap is still kept so a
// malformed or abusive request cannot hold the connection open.
const BODY_CAP = 256 * 1024; // 256 KiB

// Reads at most BODY_CAP bytes. Past it, answer 413 ONCE and keep draining
// (without keeping anything) so the client finishes sending and actually
// sees the 413 — destroying the request mid-upload resets the connection and
// the caller gets a network error instead. Past twice the cap, stop draining
// and drop it. Resolves null when the request was refused.
function readBody(req: IncomingMessage, res: ServerResponse): Promise<string | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let over = false;
    const refuse = () => { over = true; chunks.length = 0; sendJson(res, 413, { error: "request too large" }); };
    if (Number(req.headers["content-length"] ?? 0) > BODY_CAP) refuse();
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 2 * BODY_CAP) { req.destroy(); return; }
      if (over) return;
      if (size > BODY_CAP) { refuse(); return; }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(over ? null : Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => resolve(null));
    req.on("close", () => { if (!req.complete) resolve(null); });
  });
}

// This agent takes no attachments (x-aep.attachments is absent from
// agent.afm.md) and keeps no conversation history (memory.type: client) — so
// the whole request vocabulary is conversationId and message. A field
// outside it is refused, so a caller speaking a newer contract than this
// agent was built for hears so, instead of having the field silently
// ignored.
const BODY_FIELDS = new Set(["conversationId", "message", "attachments"]);

type Validated = { conversationId: string | null; message: string };

function validate(body: unknown): Validated | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "expected { message: string }" };
  const b = body as Record<string, unknown>;
  const unknown = Object.keys(b).find((key) => !BODY_FIELDS.has(key));
  if (unknown) return { error: `unknown field: ${unknown}` };

  if (Array.isArray(b.attachments) && b.attachments.length > 0) {
    return { error: "this agent does not accept attachments" };
  }

  // Not trimmed and not rejected when empty: the agent judges the text it
  // was given as it stands — blank text, a question, several sentences —
  // rather than asking a clarifying question. See agent.afm.md, "What you
  // never do".
  const message = typeof b.message === "string" ? b.message : null;
  if (message === null) return { error: "expected { message: string }" };

  if (b.conversationId !== undefined && typeof b.conversationId !== "string") {
    return { error: "conversationId must be a string" };
  }
  const conversationId = typeof b.conversationId === "string" && b.conversationId !== ""
    ? b.conversationId
    : null;

  return { conversationId, message };
}

// Reads the AI SDK's APICallError body; returns null for anything else. See
// agent-building's references/building.md, "A guardrail block is the ONE
// upstream error you relay."
function guardrailBlock(err: unknown): { name: string; reason: string } | null {
  const body = (err as { responseBody?: string })?.responseBody;
  if (!body) return null;
  try {
    const m = (JSON.parse(body) as { message?: Record<string, unknown> })?.message;
    if (m?.action !== "GUARDRAIL_INTERVENED") return null;
    return {
      name: typeof m.interveningGuardrail === "string" ? m.interveningGuardrail : "guardrail",
      reason: typeof m.actionReason === "string" ? m.actionReason : "refused by policy",
    };
  } catch {
    return null;
  }
}

const genAiSystem = config.modelFormat === "openai-compatible" ? "openai" : "anthropic";

async function handleChat(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = req.headers["x-user-id"];
  if (typeof userId !== "string" || userId === "") {
    res.statusCode = 401;
    res.end();
    return;
  }

  const missing = missingModelVars();
  if (missing.length > 0) {
    sendJson(res, 503, { error: "agent not configured", missing });
    return;
  }

  const raw = await readBody(req, res);
  if (raw === null) return; // already answered (413) or the connection died

  let parsed: unknown;
  try {
    parsed = raw === "" ? {} : JSON.parse(raw);
  } catch {
    sendJson(res, 400, { error: "expected { message: string }" });
    return;
  }

  const v = validate(parsed);
  if ("error" in v) {
    sendJson(res, 400, { error: v.error });
    return;
  }

  // Stateless, single-turn: no history is loaded and none is kept
  // (memory.type: client). The conversationId is accepted for wire-shape
  // compatibility and echoed back — or minted fresh when absent — but
  // carries no server-side state, so there is nothing to resolve and
  // nothing that can 404.
  const conversationId = v.conversationId ?? crypto.randomUUID();
  const messages: ModelMessage[] = [{ role: "user", content: v.message }];

  try {
    const turn = await traceTurn(
      {
        conversationId,
        model: config.modelName!,
        system: genAiSystem,
        message: v.message,
      },
      (hooks) => runTurn(messages, hooks),
    );
    sendJson(res, 200, { conversationId, text: turn.text, toolCalls: turn.toolCalls });
  } catch (err) {
    const g = guardrailBlock(err);
    if (g) {
      sendJson(res, 422, { error: g.reason, guardrail: g.name });
      return;
    }
    console.error("chat turn failed:", err);
    sendJson(res, 500, { error: "internal error" });
  }
}

function handleHealthz(_req: IncomingMessage, res: ServerResponse): void {
  const missing = missingModelVars();
  if (missing.length > 0) {
    sendJson(res, 503, { ok: false, missing, store: "ready" });
    return;
  }
  sendJson(res, 200, { ok: true });
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === "POST" && req.url === "/chat") {
    await handleChat(req, res);
    return;
  }
  if (req.method === "GET" && req.url === "/healthz") {
    handleHealthz(req, res);
    return;
  }
  res.statusCode = 404;
  res.end();
}

const server = http.createServer();
server.on("request", (req, res) => {
  void handle(req, res).catch((err) => {          // the last line of defence:
    console.error("request failed:", err);        // `void handle(...)` alone
    if (!res.headersSent) sendJson(res, 500, { error: "internal error" });
    else res.destroy();                           // already streaming: cut it
  });
});

server.listen(config.port, () => {
  console.log(`rudeness-checker-agent listening on ${config.port}`);
});
