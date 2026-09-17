# F11 — Seed data and fixtures

**Status:** Done (placeholder content) · **Owner:** dev lead → content lead

## What

Enough stand-in data that every other ticket could be built and tested before the
real content spreadsheet existed.

`src/fixtures/`, `supabase/seed.sql`

## Acceptance criteria

- [x] 18 placeholder remedy entries covering all 9 symptom tags
- [x] Tag distribution deliberately uneven, so the "fewer than 5 results" path is
      exercised by real data rather than only by a contrived test
- [x] Every fixture carries a source and a valid evidence level
- [x] Demo persona with pelvic pain at 5, 6, 7 then today's 8 with `missed_work`
- [x] Dates cycle-spaced so they read as real check-ins
- [x] `supabase/seed.sql` loads persona history on `supabase db reset`
- [x] Cached embeddings committed, so tests and evals run offline and deterministically
- [x] File header marks the content as not clinically reviewed
- [ ] Replaced by the content lead's real entries

## Remaining

Replace `src/fixtures/remedies.ts` wholesale, or load the real spreadsheet with
`npm run embed -- --file <path>`. Nothing imports the fixtures except tests, the
eval harness and the fixture embedder, so swapping them touches no product code.

Re-run `npm run embed:fixtures` after changing fixture text, to refresh the cache.
