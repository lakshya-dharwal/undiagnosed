import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cosineSimilarity } from './embeddings.js';
import type { RemedyEntry, ScoredRemedy, SymptomHistoryRow } from './types.js';

/**
 * Ranking lives in retrieval.ts, not in the store, so the SQL path and the
 * fixture path produce identical orderings and the eval harness measures one
 * algorithm rather than two. Stores only do: filter by tag, score by similarity.
 */
export interface RemedyStore {
  candidatesByTags(tags: string[], queryEmbedding: number[]): Promise<ScoredRemedy[]>;
  corpusSize(): Promise<number>;
}

export class InMemoryRemedyStore implements RemedyStore {
  constructor(private readonly rows: RemedyEntry[]) {}

  async candidatesByTags(tags: string[], queryEmbedding: number[]): Promise<ScoredRemedy[]> {
    return this.rows
      .filter((row) => row.embedding && row.symptom_tags.some((tag) => tags.includes(tag)))
      .map((row) => ({
        ...row,
        similarity: cosineSimilarity(queryEmbedding, row.embedding as number[]),
      }));
  }

  async corpusSize(): Promise<number> {
    return this.rows.length;
  }
}

export class SupabaseRemedyStore implements RemedyStore {
  constructor(private readonly client: SupabaseClient) {}

  async candidatesByTags(tags: string[], queryEmbedding: number[]): Promise<ScoredRemedy[]> {
    // match_count is deliberately larger than the display count: the RPC returns the
    // whole tag-filtered set so TS can apply multi-tag weighting and log every
    // candidate score for the trace. The RPC's own LIMIT 5 is the pure-SQL path.
    const { data, error } = await this.client.rpc('match_remedies', {
      query_embedding: queryEmbedding,
      filter_tags: tags,
      match_count: 200,
    });

    if (error) throw new Error(`match_remedies failed: ${error.message}`);
    return (data ?? []) as ScoredRemedy[];
  }

  async corpusSize(): Promise<number> {
    const { count, error } = await this.client
      .from('remedy_entries')
      .select('*', { count: 'exact', head: true });

    if (error) throw new Error(`corpusSize failed: ${error.message}`);
    return count ?? 0;
  }
}

export function createSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and a Supabase key must be set. See .env.example.');
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function fetchSymptomHistory(
  client: SupabaseClient,
  personaId: string,
  symptom: string,
): Promise<SymptomHistoryRow[]> {
  const { data, error } = await client
    .from('symptom_history')
    .select('*')
    .eq('persona_id', personaId)
    .eq('symptom', symptom)
    .order('entry_date', { ascending: true });

  if (error) throw new Error(`fetchSymptomHistory failed: ${error.message}`);
  return (data ?? []) as SymptomHistoryRow[];
}
