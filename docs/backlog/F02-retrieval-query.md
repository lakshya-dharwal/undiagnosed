# F02 — Tag-filtered similarity retrieval

**Status:** Done · **Owner:** dev lead

## What

Filter `remedy_entries` by `symptom_tags`, then rank the filtered set by vector
similarity to the embedded query. Never a pure unfiltered vector scan.

`supabase/migrations/20260917120000_init_schema.sql` (the `match_remedies` function),
`src/lib/retrieval.ts`, `src/lib/store.ts`

## Acceptance criteria

- [x] Single SQL function does tag filter (`&&` array overlap) then cosine ordering
- [x] Returns top 5 by default
- [x] GIN index on `symptom_tags` backs the filter
- [x] No approximate vector index at this corpus size, with the reason documented
- [x] Multi-tag queries weight the primary symptom above secondary ones
- [x] Ranking logic lives in one place so the SQL path and the in-memory fixture
      path produce identical orderings
- [x] `scripts/verify-sql-parity.ts` proves that parity across all 24 eval queries

## Golden test coverage

"tag-filtered, similarity-ranked remedies returned (3 to 5 results)"

## Notes

The RPC is called with a large `match_count` so TypeScript can apply multi-tag
weighting and record every candidate score for F09's trace. The function's own
`LIMIT 5` remains the pure-SQL path described in ARCHITECTURE.md.
