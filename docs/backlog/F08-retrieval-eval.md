# F08 — Retrieval eval harness

**Status:** Done · **Owner:** dev lead

## What

A re-runnable command that scores retrieval against a held-out query set, so
"retrieval works" is a measurement rather than an impression.

`scripts/eval-retrieval.ts`, `src/fixtures/eval-queries.ts`. Run with `npm run eval`.

## Acceptance criteria

- [x] 24 synthetic queries across casual, clinical, vague, multi-symptom and typo styles
- [x] Each query carries ground-truth expected tags
- [x] precision@3 and precision@5 per query
- [x] Pass/fail per query, with the reason printed when it fails
- [x] Aggregate mean p@3, mean p@5, pass count, and a per-style breakdown
- [x] Non-zero exit code when any query fails, so it can gate CI
- [x] Runs offline from a cached embedding set — deterministic and free to re-run
- [x] Queries expecting an empty result are scored on graceful handling, not precision

## Current result

24/24 passing · mean p@3 1.000 · mean p@5 1.000

## Golden test coverage

Supports "tag-filtered, similarity-ranked remedies returned (3 to 5 results)".

## Notes on reading the score

Relevance is judged against each query's ground-truth tags, **not** against the
tags the extractor produced. That is deliberate: if extraction mislabels a query,
every row it retrieves is off-target and precision falls to show it.

The consequence is that p@k here largely measures extraction accuracy, because tag
filtering guarantees relevance whenever extraction is correct. A 1.000 does not mean
ranking is perfect — it means nothing off-tag reached the user. Ranking quality is
checked separately by the `mustIncludeNames` assertions and by F09's trace.

Two real bugs were found by this harness on its first run: a typo budget that let
"bloating" and "clotting" cross-match, and a missing clinical synonym ("distension").
