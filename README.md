# Undiagnosed

A women's health platform for people with real, disruptive symptoms (pelvic pain, bloating, fatigue, heavy bleeding) who have been dismissed or told "nothing is wrong" by the medical system.

Built at Frontier Build NYC, September 17, 2026. Today's build focuses on **endometriosis only**.

Undiagnosed is not a diagnostic tool. It never states a diagnosis and never replaces a doctor — every insight is framed as a pattern worth discussing with a professional.

## Docs

- [docs/PRODUCT.md](./docs/PRODUCT.md) — what this is, the three product components, the golden path
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — system architecture, database, retrieval, pattern detection
- [docs/MEDICAL_SAFETY.md](./docs/MEDICAL_SAFETY.md) — non-negotiable safety rules
- [docs/DATA_MODEL.md](./docs/DATA_MODEL.md) — Supabase schema
- [docs/AGENT_RULES.md](./docs/AGENT_RULES.md) — rules for any coding agent/LLM working on this repo
- [docs/DEMO.md](./docs/DEMO.md) — golden path demo script and test checklist

## Today's Task Split

**Design/content lead**
- 10 to 15 remedy entries (endometriosis only) in the schema, with real sources
- 3 to 4 seeded past symptom entries for the demo persona showing a rising trend
- Exact wording: pattern insight sentence, each remedy explanation, Visit Report copy
- 3 Figma screens: symptom check-in/results, one repository entry page, home dashboard
- 2-minute demo walkthrough script, including the Visit Report as the closing beat

**Dev lead**
- Supabase + pgvector setup, schema creation
- Embedding pipeline (OpenAI `text-embedding-3-small`) run once over the loaded entries
- Tag-filter-then-similarity retrieval query
- Pattern detection engine (slope-based, deterministic)
- Safety enforcement in code
- Visit Report generator
- Basic UI wrapper connecting to Figma screens
- End-to-end golden path test before presenting

## Out of Scope Today

No PCOS, adenomyosis, PMDD, or perimenopause content. No community features, wearables integration, provider marketplace, mobile native app, or full condition libraries beyond the seeded set. No fine-tuned embedding models. No multi-dataset benchmarking. Scope discipline is the priority; a small, fully-working golden path beats a broad, half-working one.
