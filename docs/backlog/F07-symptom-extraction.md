# F07 — Symptom extraction from free text

**Status:** Done · **Owner:** dev lead

## What

Turn "my cramps are horrible today, probably an 8, couldn't go to work" into
structured symptom tags, severity and functional impact. Deterministic.

`src/lib/extraction.ts`, `tests/extraction.test.ts`

## Acceptance criteria

- [x] Maps free text to `symptom_tags` using a curated vocabulary
- [x] Handles casual, clinical, vague, multi-symptom and typo-laden phrasings
- [x] Severity from "8 out of 10", "8/10", "like a 6", "pain is at a 4"
- [x] Severity from intensity words when no number is given
- [x] An explicit number beats an intensity word
- [x] Ignores numbers that are not severities ("7 pm", "3 days", "a 47")
- [x] Functional impact: missed work, missed school, bedbound, cancelled plans, ER visit
- [x] Typo tolerance via Damerau-Levenshtein, so a transposition costs one edit
- [x] Edit budget capped at 1 through 9 characters — "bloating" and "clotting" are
      two edits apart and tag different symptoms
- [x] No fuzzy matching on words of 4 characters or fewer
- [x] Tested against all 24 eval phrasings, asserting no spurious tags
- [x] Fully deterministic; `needsAssist` marks where a model could help, nothing calls one

## Golden test coverage

"pelvic_pain extracted with severity = 8" and "missed_work = true captured"

## Notes

Deliberately not LLM-backed. A model here would be slower, non-reproducible, and
would make F08's eval measure the model rather than the retrieval.
