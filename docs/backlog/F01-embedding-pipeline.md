# F01 — Embedding pipeline

**Status:** Done · **Owner:** dev lead

## What

Take each remedy's `explanation_text`, embed it with OpenAI `text-embedding-3-small`,
and write the vector into `remedy_entries.embedding`. Includes a batch runner that
loads a full spreadsheet in one command.

`scripts/embed.ts`, `src/lib/embeddings.ts`

## Acceptance criteria

- [x] Embeds from `explanation_text`, not from `name` or a concatenation
- [x] Uses `text-embedding-3-small` at 1536 dimensions, matching the column type
- [x] API key read from `OPENAI_API_KEY`, never hardcoded or committed
- [x] Batch runner accepts `--file <path>` for CSV or JSON, and `--fixtures`
- [x] CSV parser handles quoted fields with embedded commas (explanation text has them)
- [x] Only embeds rows where `embedding is null`, so re-runs are incremental
- [x] Validates every row for name, explanation, source and a valid evidence level
      before writing anything, and refuses the whole load on any failure
- [x] Preserves input-to-vector ordering explicitly rather than assuming it

## Golden test coverage

Prerequisite for "tag-filtered, similarity-ranked remedies returned (3 to 5 results)".

## Remaining

Run against the content lead's real spreadsheet:
`npm run embed -- --file <path>`. Nothing in the code should need to change.
