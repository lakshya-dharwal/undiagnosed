# F06 — Next.js UI wrapper

**Status:** Scaffold · **Owner:** dev lead + design lead

## What

Frontend skeleton with routes for symptom input, pattern results, remedy
recommendations and the Visit Report, wired to the pipeline through an API route.
Structure only — the Figma design system replaces the styling wholesale.

`src/app/`

## Acceptance criteria

- [x] `/` — symptom input, free text
- [x] `/results` — pattern insight plus remedy recommendations on one page
- [x] `/report` — the Visit Report
- [x] `POST /api/checkin` runs extraction → pattern → retrieval → safety → report
- [x] Remedy cards show explanation, caution, evidence level, source and disclaimer
- [x] `?debug=1` on `/results` reveals the F09 retrieval trace
- [x] Explanation text rendered verbatim from the pipeline, never re-worded in the view
- [x] Empty state when a page is opened without a check-in
- [ ] Figma screens applied

## Golden test coverage

"symptom input accepted" and "human-authored explanation text rendered exactly, not paraphrased"

## Remaining

Design lead's three Figma screens. Page state currently hands off through
`sessionStorage` (`src/app/checkin-state.ts`); swap for a real session or a
`conversation_log` row when check-ins need to outlive one tab.

## How to run

```
supabase start
npm run embed -- --fixtures    # or --file <real spreadsheet>
npm run dev
```
