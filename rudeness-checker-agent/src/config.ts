// Config read from environment variables by name, in one place. Nothing else
// reads process.env directly.

export interface Config {
  port: number;
  modelFormat: string | undefined;
  modelEndpoint: string | undefined;
  modelApiKey: string | undefined;
  modelName: string | undefined;
  modelAuthScheme: string | undefined;
  modelApiKeyHeader: string | undefined;
}

export const config: Config = {
  port: Number(process.env.PORT ?? 9090),
  modelFormat: process.env.MODEL_API_FORMAT,
  modelEndpoint: process.env.MODEL_ENDPOINT,
  modelApiKey: process.env.MODEL_API_KEY,
  modelName: process.env.MODEL_NAME,
  modelAuthScheme: process.env.MODEL_API_AUTH_SCHEME,
  modelApiKeyHeader: process.env.MODEL_API_KEY_HEADER,
};

// The component starts with no required environment variables (the
// component contract); a missing MODEL_* is reported here and by /healthz,
// never discovered by crash-looping or inside a user's first message.
export function missingModelVars(): string[] {
  const missing: string[] = [];
  if (!config.modelFormat) missing.push("MODEL_API_FORMAT");
  if (!config.modelEndpoint) missing.push("MODEL_ENDPOINT");
  if (!config.modelApiKey) missing.push("MODEL_API_KEY");
  if (!config.modelName) missing.push("MODEL_NAME");
  return missing;
}
