# F04 — Safety enforcement guard

**Status:** Done · **Owner:** dev lead

## What

Code-level gate that blocks any remedy from rendering unless `source`,
`evidence_level` and a disclaimer are all present. Enforced in code, not asked
for in a prompt.

`src/lib/safety.ts`, `tests/safety.test.ts`

## Acceptance criteria

- [x] Blocks a missing or whitespace-only `source`
- [x] Blocks a missing `evidence_level`
- [x] Blocks an `evidence_level` outside `strong | moderate | early`
- [x] Blocks a missing disclaimer
- [x] Blocks a missing `explanation_text`
- [x] Reports every violation at once rather than stopping at the first
- [x] Separates blocked remedies from safe ones instead of failing the whole batch
- [x] Flags diagnostic language as a backstop, with no false positives on safe copy
      such as "you have options" or "not a diagnosis"
- [x] Runs a second time inside the Visit Report generator, since that artifact
      leaves the app on paper

## Golden test coverage

"each remedy includes source + evidence_level + disclaimer" and
"output does NOT contain a diagnostic claim"

## Notes

The diagnostic-language check is a backstop, not the primary control. The primary
control is that remedy copy is human-authored and rendered verbatim, so there is
no generation step that could produce a diagnosis in the first place.
