// wireframes.dsl: screen VerdictResult — the submitted sentence in a card with
// a plain rude/not-rude badge, and "Check another sentence" -> CheckSentence.
import { useEffect, type ReactElement } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  PageContent,
  PageTitle,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Chip,
  Stack,
  Button,
} from "@wso2/oxygen-ui";
import type { Verdict } from "../api";

interface VerdictState {
  sentence: string;
  verdict: Verdict;
  reply: string;
}

const BADGE: Record<Verdict, { label: string; color: "error" | "success" | "warning" }> = {
  rude: { label: "Rude", color: "error" },
  "not-rude": { label: "Not rude", color: "success" },
  unclear: { label: "Unclear", color: "warning" },
};

export function VerdictResultPage(): ReactElement | null {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? null) as VerdictState | null;

  // This app keeps no history of past checks (the product's stateless
  // design), so there is nothing to show when this route is opened with no
  // state — a refresh, a typed URL, or Back after a sign-out/in. Send the
  // visitor back to submit a fresh sentence rather than rendering a blank
  // result.
  useEffect(() => {
    if (!state) navigate("/check", { replace: true });
  }, [state, navigate]);

  if (!state) return null;

  const badge = BADGE[state.verdict];

  return (
    <PageContent maxWidth="sm">
      <PageTitle>
        <PageTitle.Header>Result</PageTitle.Header>
      </PageTitle>
      <Card>
        <CardHeader
          title="Your sentence"
          action={<Chip label={badge.label} color={badge.color} size="small" />}
        />
        <CardContent>
          <Typography variant="body1">{state.sentence}</Typography>
          {state.verdict === "unclear" ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              The agent replied: “{state.reply}”
            </Typography>
          ) : null}
        </CardContent>
      </Card>
      <Stack direction="row" sx={{ mt: 3 }}>
        <Button variant="contained" onClick={() => navigate("/check")}>
          Check another sentence
        </Button>
      </Stack>
    </PageContent>
  );
}
