// mock/plugin.ts serves this on /env-config.js — the keys this app actually
// declares in src/env.ts, and only those. `sentences:check` rides the scope
// string because security.json grants it to the User role, even though
// nothing in this app enforces it (rudeness-checker-agent has no
// openapi.yaml for the mock gateway to read — see mock/handlers.ts).
export const mockEnv = {
  USER_AUTH_CLIENT_ID: "mock-client",
  USER_AUTH_ISSUER: "https://mock-idp.test",
  USER_AUTH_SCOPES: "openid profile email group ou sentences:check",
  USER_AUTH_RESOURCE: "https://mock-idp.test/resources/mock-project",
};
