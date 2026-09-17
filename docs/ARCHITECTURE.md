# Architecture

```
FRONTEND (connects to Figma-designed screens)
        |
APPLICATION API
        |
   ORCHESTRATOR
        |
 ┌──────┼──────────┬─────────────┐
 ▼      ▼          ▼             ▼
Intake  Pattern   RAG          Safety
Extract Engine   Retrieval     Layer
 │      │          │             │
 └──────┼──────────┼─────────────┘
        ▼
   DATA LAYER (Supabase + pgvector)
   remedy_entries | symptom_history | conversation_log
        │
        ▼
  VISIT REPORT GENERATOR
```

**Database:** Supabase with the pgvector extension enabled. Supabase is the database; pgvector is the extension inside it enabling vector similarity search. One unified system for structured fields (name, source, evidence_level) and embeddings, avoids splitting data across two services.

**Embedding model:** OpenAI `text-embedding-3-small`, called via API (not downloaded, not local). Requires an OpenAI API key set as an environment variable, never hardcoded or committed to the repo. Note: the event sponsor (Obvious) provides credits for their own agent platform, not for OpenAI's embeddings API — a separate OpenAI key is still needed.

**Retrieval query:** single SQL query that filters `remedy_entries` by matching `symptom_tags`, then orders the filtered set by vector similarity (`embedding <-> query_embedding`) to the embedded user query. Do not run pure unfiltered vector search — at this small a corpus size it risks irrelevant matches.

**Pattern detection:** plain deterministic function, no ML. Takes an ordered list of severity values, computes rate of change/slope, flags `increasing_severity` if the trend is positive and meaningfully large. Runs before RAG retrieval, since the detected pattern informs which symptom tag gets queried.

**Safety enforcement:** enforced in code, not just prompted. Every remedy object rendered to the user must have a non-null `source`, `evidence_level`, and a disclaimer attached before it's allowed to display. The LLM's job is to explain retrieved content, never to invent remedies or add unsourced claims.
