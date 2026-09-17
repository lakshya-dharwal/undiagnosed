# Product

## 1. What This Is

Undiagnosed is a women's health platform for people with real, disruptive symptoms (pelvic pain, bloating, fatigue, heavy bleeding) who have been dismissed or told "nothing is wrong" by the medical system. Today's build focuses on **endometriosis only**. PCOS, adenomyosis, PMDD, and perimenopause are real roadmap items, not in scope today.

The emotional core: she is not dramatic, not anxious, not imagining it. She is undiagnosed, and this app helps her get language for what her body is doing and a clear next step.

What this is **NOT**: not a diagnostic tool. It never states a diagnosis. It never replaces a doctor. Every insight is framed as a pattern worth discussing with a professional, never a medical claim.

## 2. The Three Real Product Components

**A. AI Pattern Detection**
Deterministic code (not machine learning) that compares a new symptom entry against a small seeded history and detects a rising trend. Example: pelvic pain reported as 5, 6, 7 across past entries, then 8 today. Use rate-of-change (slope) across entries rather than a strict "always increasing" check, so a single minor dip doesn't break detection.

**B. AI Remedy Recommendation (RAG)**
A small, curated, sourced library of 10 to 15 endometriosis remedies. Retrieval is two-layer: filter by symptom tag first, then rank the filtered set by embedding similarity to the query. Never let the model invent a remedy outside the curated set. Every remedy shown must carry its source and evidence level.

**C. Visit Report**
Compiles the detected pattern, the retrieved remedies (with sources), and relevant questions into one document the user can bring to a doctor's appointment. This is the demo's closing beat, not an afterthought.

## 3. The Golden Path (the entire demo)

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

### Demo script anchor (for testing and presenting)

User types: *"my cramps are horrible again today, probably an 8 out of 10, and I couldn't go to work."*

Seeded history for this persona: pelvic pain 5 (entry 1), 6 (entry 2), 7 (entry 3).

Expected system behavior: detects rising trend (5→6→7→8), surfaces the pattern, retrieves top 3 to 5 tagged remedies for `pelvic_pain`, generates a Visit Report referencing the correct values.
