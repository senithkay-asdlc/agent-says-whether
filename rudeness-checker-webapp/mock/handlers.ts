// mock/authz/gateway.ts enforces NO operation here: rudeness-checker-agent is
// an `ai-agent` dependency reached through the platform's fixed chat
// contract, not an openapi.yaml, so mock/plugin.ts finds no contract
// declaring an `oauth2` scheme anywhere in this project and the gateway table
// is null (empty gatewayHandlers). This handler is therefore the one and only
// layer standing in for the agent in mock mode — there is no scope to check
// and nothing to fall through from.
//
// It plays the same role agent.afm.md gives the real agent: read the one
// sentence in `message`, judge it, reply with a short plain-prose verdict
// leading with "Rude." or "Not rude." — never an explanation, a score or a
// category — and hold no memory of any earlier turn (no conversationId is
// read from the request; a fresh one is minted on every call).
import { http, HttpResponse } from "msw";

const RUDE_SIGNALS = [
  "stupid",
  "idiot",
  "shut up",
  "shut it",
  "dumb",
  "moron",
  "pathetic",
  "useless",
  "hate you",
  "screw you",
  "loser",
  "slower",
  "incompetent",
];

function judge(sentence: string): string {
  const normalized = sentence.toLowerCase();
  const isRude = RUDE_SIGNALS.some((signal) => normalized.includes(signal));
  return isRude ? "Rude." : "Not rude.";
}

export const handlers = [
  http.post("/api/chat", async ({ request }) => {
    const body = (await request.json()) as { message?: string };
    const message = body?.message ?? "";
    return HttpResponse.json({
      conversationId: crypto.randomUUID(),
      text: judge(message),
      toolCalls: [],
    });
  }),
];
