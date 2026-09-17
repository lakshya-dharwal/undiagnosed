# F10 — Retrieval edge cases

**Status:** Done · **Owner:** dev lead

## What

The five hard retrieval cases, each handled explicitly with a decision recorded in
code and a test pinning the behaviour.

`src/lib/retrieval.ts`, `tests/retrieval-edge-cases.test.ts`

## Cases and decisions

**Multiple symptoms named.** First-named symptom gets weight 1.0, the rest 0.85.
Weighting rather than hard-filtering, so a strong secondary match can outrank a weak
primary one without letting an untagged remedy in.

**Symptom has no tagged remedies.** Status `no_remedies_for_tag`, empty result, and a
message. Never a substitute result from another tag.

**Phrasing matches no tag vocabulary.** Status `no_tag_match`, empty result, and a
prompt for more detail. Explicitly *not* a fallback to unfiltered vector search: on an
18-row corpus that returns the nearest thing to nonsense with full confidence, which
is worse than asking one more question.

**Fewer than 5 rows survive the filter.** Return fewer, status `fewer_than_requested`.
The filter is never loosened to pad the list — that would show remedies not tagged for
her symptom, which is a relevance regression dressed up as completeness.

**Near-identical similarity scores.** Scores are bucketed at 0.01 and ties are broken
by evidence level, strongest first, then alphabetically for a stable order. Without
bucketing a 0.001 gap would silently decide which remedy she sees first.

## Acceptance criteria

- [x] Each of the five cases has a decision documented in a code comment
- [x] Each has at least one test
- [x] Tiebreak order verified as strong → moderate → early
- [x] Alphabetical fallback verified when evidence level also ties
- [x] Verified that no code path performs unfiltered vector search
