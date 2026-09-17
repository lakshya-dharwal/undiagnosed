-- Undiagnosed: initial schema (endometriosis scope only).
-- See docs/DATA_MODEL.md for the field-by-field spec.

create extension if not exists vector;

create table if not exists remedy_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  symptom_tags text[] not null default '{}',
  explanation_text text not null,
  source text not null,
  evidence_level text not null check (evidence_level in ('strong', 'moderate', 'early')),
  caution text,
  embedding vector(1536)
);

create table if not exists symptom_history (
  id uuid primary key default gen_random_uuid(),
  persona_id text not null,
  symptom text not null,
  severity int not null check (severity between 1 and 10),
  entry_date timestamptz not null,
  functional_impact jsonb not null default '{}'::jsonb
);

-- Tag filtering is the primary access path (layer 1 of retrieval), so it gets the index.
create index if not exists remedy_entries_symptom_tags_idx
  on remedy_entries using gin (symptom_tags);

create index if not exists symptom_history_persona_date_idx
  on symptom_history (persona_id, symptom, entry_date);

-- Deliberately NO ivfflat/hnsw index on embedding: at 10-15 rows an approximate
-- index degrades recall while saving no measurable time. Add one past ~1k rows.

-- Retrieval: tag filter first, then rank the filtered set by cosine similarity.
-- Never an unfiltered vector scan (docs/ARCHITECTURE.md).
create or replace function match_remedies(
  query_embedding vector(1536),
  filter_tags text[],
  match_count int default 5
)
returns table (
  id uuid,
  name text,
  symptom_tags text[],
  explanation_text text,
  source text,
  evidence_level text,
  caution text,
  similarity float
)
language sql
stable
as $$
  select
    r.id,
    r.name,
    r.symptom_tags,
    r.explanation_text,
    r.source,
    r.evidence_level,
    r.caution,
    1 - (r.embedding <=> query_embedding) as similarity
  from remedy_entries r
  where r.embedding is not null
    and r.symptom_tags && filter_tags
  order by
    -- Rounding to 2dp buckets near-identical scores so the evidence tiebreak below
    -- can act on them; without it, a 0.001 gap would silently decide the ranking.
    round((r.embedding <=> query_embedding)::numeric, 2),
    case r.evidence_level
      when 'strong' then 0
      when 'moderate' then 1
      else 2
    end,
    r.name
  limit match_count;
$$;
