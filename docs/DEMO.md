# Demo

## Golden Path Script

```
User describes a symptom in plain language, in the app's warm tone
        |
System checks it against seeded history, detects a rising trend
        |
"Here's what your body might be dealing with" — pattern shown plainly
        |
System retrieves matching remedies (tag filter, then similarity ranking)
        |
"Here is your next step" — 3 to 5 remedies, each with source + evidence level
        |
Everything compiles into a Visit Report
```

### Demo script anchor

User types: *"my cramps are horrible again today, probably an 8 out of 10, and I couldn't go to work."*

Seeded history for this persona: pelvic pain 5 (entry 1), 6 (entry 2), 7 (entry 3).

Expected system behavior: detects rising trend (5→6→7→8), surfaces the pattern, retrieves top 3 to 5 tagged remedies for `pelvic_pain`, generates a Visit Report referencing the correct values.

## Golden Test Checklist

- [ ] symptom input accepted
- [ ] pelvic_pain extracted with severity = 8
- [ ] missed_work = true captured
- [ ] seeded history retrieved (5, 6, 7)
- [ ] increasing_severity pattern correctly detected
- [ ] tag-filtered, similarity-ranked remedies returned (3 to 5 results)
- [ ] each remedy includes source + evidence_level + disclaimer
- [ ] human-authored explanation text rendered exactly, not paraphrased
- [ ] output does NOT contain a diagnostic claim
- [ ] Visit Report generated with correct pattern values and remedy list
