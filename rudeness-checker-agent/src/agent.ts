import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, stepCountIs, type LanguageModel, type ModelMessage } from "ai";
import { config } from "./config.js";
import { SYSTEM_PROMPT, MAX_ITERATIONS } from "./prompt.js";
import { tools } from "./tools.js";
import type { TurnHooks } from "./tracing.js";

export interface ModelSettings {
  format: string;
  baseURL: string;
  apiKey: string;
  modelName: string;
  keyHeader?: string;
  authScheme?: string;
}

// Filled from config once /healthz's required variables are all set — see
// config.missingModelVars().
export function modelSettings(): ModelSettings {
  return {
    format: config.modelFormat!,
    baseURL: config.modelEndpoint!,
    apiKey: config.modelApiKey!,
    modelName: config.modelName!,
    keyHeader: config.modelApiKeyHeader,
    authScheme: config.modelAuthScheme,
  };
}

// The model provider is chosen at runtime from MODEL_API_FORMAT, never at
// build time, so the organisation can switch its connection without a
// rebuild. See agent-building's references/building.md, "Model access".
export function modelClient(
  { format, baseURL, apiKey, modelName, keyHeader, authScheme }: ModelSettings,
): LanguageModel {
  switch (format) {
    case "anthropic":
      return createAnthropic({
        baseURL,
        ...(keyHeader
          ? { apiKey: "unused", headers: { [keyHeader]: apiKey } } // SDK will not start without an apiKey
          : authScheme === "bearer"
            ? { authToken: apiKey }                                // Authorization: Bearer
            : { apiKey }),                                         // x-api-key
      })(modelName);
    case "openai-compatible":
      return createOpenAICompatible({
        name: "model",
        baseURL,
        includeUsage: true, // a streamed turn reports usage only when asked
        // No apiKey under the override: this SDK sends Authorization only
        // when given one, so the key goes out once, under the named header.
        ...(keyHeader ? { headers: { [keyHeader]: apiKey } } : { apiKey }),
      })(modelName);
    default:
      throw new Error(`unsupported MODEL_API_FORMAT: ${format}`);
  }
}

// One turn, one model call: this agent has no tools (src/tools.ts is empty),
// so MAX_ITERATIONS bounds the loop at a single step regardless.
export async function runTurn(messages: ModelMessage[], hooks: TurnHooks) {
  let failure: unknown;
  const result = streamText({
    model: modelClient(modelSettings()),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    stopWhen: stepCountIs(MAX_ITERATIONS),
    // A provider error arrives HERE, not as the rejection below.
    onError: ({ error }) => { failure ??= error; },
    // Opens and closes a span per model call and per tool call — "Tracing".
    ...hooks,
  });
  // Awaiting these drives the stream, every tool step included, to its end.
  const [text, steps, toolCalls, usage] = await Promise.all([
    result.text, result.steps, result.toolCalls, result.totalUsage,
  ]).catch((err: unknown) => { throw failure ?? err; });
  if (failure !== undefined) throw failure;
  return { text, steps, toolCalls, usage };
}
