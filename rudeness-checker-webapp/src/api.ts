// rudeness-checker-agent is an `ai-agent` dependency: no OpenAPI contract to
// generate a client from, only the platform's fixed chat contract, reached
// same-origin exactly like any other sibling (react-webapp, "An ai-agent
// dependency has no OpenAPI contract"). It is this app's one and only
// functional dependency, so it is called at the primary path, `/api/chat`.
//
//   POST /api/chat
//   in:  { conversationId?: string, message: string }
//   out: { conversationId: string, text: string, toolCalls: unknown[] }
//
// This app keeps NO conversation state across checks (mirrors the product's
// stateless design — agent.afm.md's `memory.type: client` and the issue's "no
// history of past checks"): conversationId is never read from a prior
// response and never sent, so every submission starts a fresh agent turn with
// nothing carried over.
import { apiJson } from "./authz/client";

export interface ChatResponse {
  conversationId: string;
  text: string;
  toolCalls: unknown[];
}

/** One fresh agent turn: submits a sentence, returns its raw verdict text. */
export async function checkSentence(sentence: string): Promise<ChatResponse> {
  return apiJson<ChatResponse>("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: sentence }),
  });
}

export type Verdict = "rude" | "not-rude" | "unclear";

/**
 * The agent replies in plain prose ("Rude." / "Not rude.", agent.afm.md's
 * "Reply shape") — there is no structured field to read, so this is the one
 * place the webapp interprets that text into the plain badge the design
 * calls for. "not rude" is checked before "rude" because the shorter word is
 * a substring of the longer one. Never falls back to judging rudeness itself
 * — a reply that names neither word surfaces as "unclear" alongside the raw
 * text, rather than guessing.
 */
export function verdictFromText(text: string): Verdict {
  const normalized = text.toLowerCase();
  if (normalized.includes("not rude")) return "not-rude";
  if (normalized.includes("rude")) return "rude";
  return "unclear";
}
