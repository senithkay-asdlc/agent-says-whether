// Adapted from thunder-authentication's App.example.tsx pattern. The routing
// STRUCTURE below is prescribed by that skill:
//
//   /callback is routed OUTSIDE the provider — there is no session yet.
//   Every other route sits behind AuthzProvider + the sign-in guard.
//   Forbidden is wired once, at the router root.
//
// This app has NO public screens (wireframes.dsl's one flow carries
// `role "User"`) and NO scope-gated screens either — rudeness-checker-agent
// is an `ai-agent` dependency with no openapi.yaml, so OperationKey is empty
// and every screen in src/authz/screens.ts is `loads: null`. That means
// `<RequireOperation>` is never used here: the only gate this app has is
// sign-in itself, exactly as the issue describes ("Sign-in is enforced ...
// before any screen is usable"). For the same reason this file asks
// `reachableScreens(...).length === 0`, not thunder-authentication's usual
// `hasScopedReach`: that helper asks whether the caller's SCOPES earned them
// anything, which is unanswerable here because nothing in this app is scope
// gated — every signed-in caller reaches both screens, so the emptiness
// check below is equivalent and never fires NoAccess for a signed-in user.
import { useEffect, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthzProvider, Forbidden, NoAccess, useAuthz, useScopes } from "./authz/gates";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { SCREEN_ROUTES, reachableScreens } from "./authz/screens";
import { AppShell } from "./shell/AppShell";
import { APP_NAME } from "./appName";
import { CallbackPage } from "./pages/Callback";
import { CheckSentencePage } from "./pages/CheckSentence";
import { VerdictResultPage } from "./pages/VerdictResult";

const PAGE_BY_KEY: Record<string, ReactElement> = {
  "check-sentence": <CheckSentencePage />,
  "verdict-result": <VerdictResultPage />,
};

export function App(): ReactElement {
  return (
    <BrowserRouter>
      <ForbiddenWiring />
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="*"
          element={
            <AuthzProvider fallback={<Splash />}>
              <SignedIn />
            </AuthzProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Hands src/authz/client.ts the route a refusal goes to, ONCE, from inside
 * the router and above every route.
 */
function ForbiddenWiring(): null {
  const navigate = useNavigate();
  useEffect(() => {
    setForbiddenNavigator(() => navigate("/forbidden", { replace: true }));
  }, [navigate]);
  return null;
}

function Splash(): ReactElement {
  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>Checking your session…</p>
    </main>
  );
}

function SignedIn(): ReactElement {
  const { signedIn } = useAuthz();
  const scopes = useScopes();

  // The load-time guard. Only a MISSING session starts a sign-in: currentUser()
  // already tried a silent renew, and signing in on a merely expired token
  // re-logs the user in on every visit.
  useEffect(() => {
    if (!signedIn) void signIn();
  }, [signedIn]);

  if (!signedIn) return <Splash />;

  const reachable = reachableScreens(scopes, signedIn);

  // Never fires for a signed-in caller here — see the file comment above —
  // but kept so a future screen that DOES gate on a scope still gets a real
  // "nothing for you" page instead of a blank one.
  if (reachable.length === 0) return <NoAccess appName={APP_NAME} />;

  const landing = reachable[0].path;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={landing} replace />} />
        {SCREEN_ROUTES.map((screen) => (
          <Route key={screen.key} path={screen.path} element={PAGE_BY_KEY[screen.key]} />
        ))}
        {/* Platform-prescribed; appears in no wireframe. Unreachable in the
            ordinary case (no screen here gates on a scope — see the file
            comment above) but wired for the rare 403 a race could still
            produce, same as any other app with this auth dependency. */}
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<Navigate to={landing} replace />} />
      </Route>
    </Routes>
  );
}
