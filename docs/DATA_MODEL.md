# Data Model

## Table: `remedy_entries`

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| name | text | remedy name |
| symptom_tags | text[] | e.g. `["pelvic_pain", "bloating"]` |
| explanation_text | text | plain-language explanation, human-written voice, this is what gets embedded and shown |
| source | text | citation, e.g. PubMed/ACOG/NIH/Mayo Clinic link or reference |
| evidence_level | text | "strong" \| "moderate" \| "early" |
| caution | text | nullable, warning if relevant |
| embedding | vector | generated from `explanation_text` via OpenAI `text-embedding-3-small` |

## Table: `symptom_history` (seeded demo data)

| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| persona_id | text | demo persona identifier |
| symptom | text | e.g. "pelvic_pain" |
| severity | int | 1 to 10 |
| entry_date | timestamp | ordered chronologically |
| functional_impact | jsonb | e.g. `{"missed_work": true}` |
