# F12 — End-to-end golden path test

**Status:** Done · **Owner:** dev lead

## What

One test file that asserts every line of the golden test checklist in
[DEMO.md](../DEMO.md), using the demo script anchor as its input.

`tests/golden-path.test.ts`, orchestrated by `src/lib/pipeline.ts`

## Acceptance criteria

Each maps to one checklist line:

- [x] symptom input accepted
- [x] `pelvic_pain` extracted with severity 8
- [x] `missed_work = true` captured
- [x] seeded history retrieved as 5, 6, 7 with today's 8 appended
- [x] `increasing_severity` correctly detected
- [x] 3 to 5 remedies returned, every one tagged `pelvic_pain`, in descending score order
- [x] every remedy carries a non-empty source, a valid evidence level and a disclaimer
- [x] explanation text byte-identical to the stored entry, not paraphrased
- [x] no diagnostic claim anywhere in the rendered report
- [x] Visit Report contains the correct pattern values and remedy list

## Also verified

`scripts/verify-sql-parity.ts` confirms pgvector and the in-memory fixture store
return the same remedies in the same order for all 24 eval queries. Without that,
a passing test against fixtures would say nothing about what production returns.

## Current result

100 tests passing across 5 files.
