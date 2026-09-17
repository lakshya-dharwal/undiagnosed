# F05 — Visit Report generator

**Status:** Scaffold · **Owner:** dev lead + content lead

## What

Assemble the detected pattern, the retrieved remedies with their sources, and
questions to ask into one document to bring to an appointment. The demo's closing beat.

`src/lib/visit-report.ts`

## Acceptance criteria

- [x] Takes a pattern result plus a remedy list and returns a structured document
- [x] Sections: pattern summary, functional impact, remedies with sources, questions
- [x] Impact section is omitted entirely when nothing was reported
- [x] Questions adapt to the detected pattern and to reported impact
- [x] Re-runs the F04 safety gate over its input
- [x] Reports `blockedRemedyCount` rather than silently dropping remedies
- [x] Values are interpolated into fixed templates — no runtime model generation
- [x] Plain-text renderer for print and copy-paste
- [ ] Human-authored copy replaces every string marked `PLACEHOLDER COPY`

## Golden test coverage

"Visit Report generated with correct pattern values and remedy list"

## Remaining

Content lead's Visit Report wording. Every placeholder is marked with a
`PLACEHOLDER COPY` comment; `grep -rn "PLACEHOLDER COPY" src/` lists them all.
