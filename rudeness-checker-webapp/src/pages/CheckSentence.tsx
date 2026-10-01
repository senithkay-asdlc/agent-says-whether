// wireframes.dsl: screen CheckSentence — textarea + "Check sentence" primary
// button -> VerdictResult.
import { useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageContent,
  PageTitle,
  Form,
  TextField,
  Button,
  Stack,
  Alert,
} from "@wso2/oxygen-ui";
import { checkSentence, verdictFromText } from "../api";
import { ApiError, ForbiddenError } from "../authz/client";

export function CheckSentencePage(): ReactElement {
  const [sentence, setSentence] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(): Promise<void> {
    const trimmed = sentence.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      // A fresh agent turn every time: no conversationId is ever read from a
      // prior response or sent on this one (api.ts), so nothing carries over
      // between checks.
      const response = await checkSentence(trimmed);
      navigate("/result", {
        state: {
          sentence: trimmed,
          verdict: verdictFromText(response.text),
          reply: response.text,
        },
      });
    } catch (err) {
      if (err instanceof ForbiddenError) {
        setError(err.message);
      } else if (err instanceof ApiError) {
        setError("Could not reach the rudeness checker. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContent maxWidth="sm">
      <PageTitle>
        <PageTitle.Header>Check a sentence</PageTitle.Header>
      </PageTitle>
      <Form.Section>
        <Form.Stack spacing={3}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Type your sentence here…"
            multiline
            minRows={4}
            fullWidth
            value={sentence}
            onChange={(event) => setSentence(event.target.value)}
            disabled={submitting}
          />
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={() => void handleSubmit()}
              disabled={submitting || sentence.trim().length === 0}
            >
              {submitting ? "Checking…" : "Check sentence"}
            </Button>
          </Stack>
        </Form.Stack>
      </Form.Section>
    </PageContent>
  );
}
