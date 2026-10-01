screen CheckSentence "Type a sentence and find out whether it reads as rude"
  navbar "Rudeness Checker"
  heading "Check a sentence"
  textarea "Type your sentence here…"
  button "Check sentence" primary -> VerdictResult

screen VerdictResult "The agent's rudeness verdict for the submitted sentence"
  navbar "Rudeness Checker"
  heading "Result"
  card "Your sentence"
    text "Could you possibly be any slower?"
    badge "Rude" danger
  row
    button "Check another sentence" primary -> CheckSentence

flow "Check a sentence"
  role "User"
  description "A signed-in user submits a sentence and reads its rudeness verdict"
  CheckSentence
  VerdictResult
