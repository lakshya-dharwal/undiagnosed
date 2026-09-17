# F03 — Slope-based pattern detection

**Status:** Done · **Owner:** dev lead

## What

Deterministic trend detection over an ordered list of severity values. No ML.
Runs before retrieval, because the detected symptom decides which tag gets queried.

`src/lib/pattern.ts`, `tests/pattern.test.ts`

## Acceptance criteria

- [x] Least-squares slope, not a strict "every value higher than the last" check
- [x] Returns `{ pattern, symptom, values, detected, slope, netChange, dips }`
- [x] Flags `increasing_severity` when slope ≥ 0.3 severity points per entry
- [x] Tolerates a single dip: `[5, 7, 6, 8]` still reads as rising
- [x] Flat series reads as `stable`, not as a trend
- [x] Oscillating noise (`[6, 5, 6, 5, 6]`) reads as `stable`
- [x] Declining series reads as `decreasing_severity`, distinct from rising
- [x] Fewer than 3 entries returns `insufficient_data` rather than a guess
- [x] `severitySeries` sorts history chronologically before computing

## Golden test coverage

"seeded history retrieved (5, 6, 7)" and "increasing_severity pattern correctly detected"
