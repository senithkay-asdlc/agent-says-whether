# Agent Says Whether — PRD

## Problem Statement

People drafting messages, replies, or comments often cannot tell whether their
own wording will land as rude before they send it. Today they either ask a
colleague, guess, or send it anyway and find out the hard way — there is no
quick, private way to check a single sentence's tone before it goes out.

## Solution

A simple, signed-in web tool where a user types a sentence and an agent tells
them, plainly, whether it is rude or not. No setup, no history to manage —
type a sentence, get a verdict, try another.

## Actors

- **User** — signs in, types a sentence, and receives a yes/no rudeness
verdict for it.

## User Stories

1. As a User, I want to type a sentence and submit it for checking, so that I
 can find out whether it comes across as rude.
2. As a User, I want to receive a clear yes/no verdict on the sentence I
 submitted, so that I can quickly judge whether to send it or rephrase it.
3. As a User, I want to immediately check another sentence after getting a
 verdict, so that I can test several pieces of wording in one sitting.

## Product Decisions

- **Sign-in:** every user signs in via the organization's standard SSO
(Thunder) before checking sentences — an org default.
- **Rudeness classification:** an agent judges each submitted sentence and
returns a yes/no verdict. It runs on the organization's own model
connection, so no external provider is named or needed.
- **Verdict detail:** the result is a simple yes/no ("rude" / "not rude") —
no explanation, severity score, or category is returned.
- **History:** checks are stateless — nothing is saved after the verdict is
shown; there is no list of past checks.
- **Language:** the agent judges sentences written in English. *assumed*

## Out of Scope

- Saving or displaying a history of past checks.
- An admin or moderator role that reviews other users' activity.
- Explanations, severity scores, or categories alongside the verdict.
- Checking anything other than a single sentence at a time (no bulk/paragraph
analysis).
- Support for languages other than English.

## Open Questions

None — the walk is covered by stated decisions and reasonable defaults above.

## Further Notes

This is intentionally a minimal, single-purpose tool: one actor, one action
(submit a sentence), one outcome (a yes/no verdict).