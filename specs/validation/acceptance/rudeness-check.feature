Feature: Sentence rudeness check

  @story-1 @story-2
  Rule: A signed-in User submitting a sentence receives a yes/no rudeness verdict

    Scenario: A rude sentence is flagged
      Given Maria is signed in
      When Maria submits the sentence "Could you possibly be any slower?"
      Then she is shown a verdict that the sentence is rude

    Scenario: A polite sentence is cleared
      Given Maria is signed in
      When Maria submits the sentence "Could you help me with this when you have a moment?"
      Then she is shown a verdict that the sentence is not rude

  @story-2
  Rule: The verdict is a plain yes or no, with no explanation, score, or category

    Scenario: The result carries no extra detail
      Given Maria is signed in
      When Maria submits the sentence "Get out of my way."
      Then she is shown only a rude / not rude verdict, with no explanation, score, or category attached

  @story-3
  Rule: A User may check another sentence right after getting a verdict

    Scenario: Checking a second sentence in the same session
      Given Maria has just received a verdict for "Get out of my way."
      When Maria submits a new sentence "Thanks so much for your help!"
      Then she is shown a fresh verdict for the new sentence
