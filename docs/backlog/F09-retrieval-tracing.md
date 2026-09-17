# F09 — Retrieval tracing and debug view

**Status:** Done · **Owner:** dev lead

## What

For any query, show every decision retrieval made: which tags were extracted, how
many rows survived filtering, every candidate's score, and why the top 5 ranked
where they did.

`src/lib/tracing.ts`, `scripts/trace.ts`, `?debug=1` on `/results`.
Run with `npm run trace -- "<symptom text>"`.

## Acceptance criteria

- [x] Shows extracted tags, their weights, the matched phrase, and exact vs fuzzy match
- [x] Shows severity and functional impact
- [x] Shows how many rows of the corpus survived the tag filter
- [x] Shows every candidate's base similarity, tag weight and final score — not just
      the returned five
- [x] Names every tiebreak, the remedies involved, and what resolved it
- [x] Gives a per-result reason string for the final ranking
- [x] CLI output plus a hidden `?debug=1` view in the UI
- [x] Trace is populated on empty results too, so a no-match is debuggable

## Golden test coverage

Supporting infrastructure; `tests/retrieval-edge-cases.test.ts` asserts trace
completeness and that candidate order matches returned order.
