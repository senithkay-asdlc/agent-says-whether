// Finishes whichever OAuth leg landed on /callback (thunder-authentication:
// handleCallback() dispatches both the redirect and the silent-renew legs).
// Routed OUTSIDE the authz provider — there is no session to read yet.
import { useEffect, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@wso2/oxygen-ui";
import { handleCallback } from "../authz/session";
import { APP_NAME } from "../appName";

export function CallbackPage(): ReactElement {
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    void (async () => {
      await handleCallback();
      if (live) navigate("/", { replace: true });
    })();
    return () => {
      live = false;
    };
  }, [navigate]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Signing in to {APP_NAME}…
      </Typography>
    </Box>
  );
}
