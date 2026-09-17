import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { EMBEDDING_DIM, EMBEDDING_MODEL, embedText } from '../lib/embeddings.js';
import { InMemoryRemedyStore } from '../lib/store.js';
import type { RemedyEntry } from '../lib/types.js';
import { REMEDY_FIXTURES } from './remedies.js';

type EmbeddingCache = {
  model: string;
  generatedAt: string;
  remedies: Record<string, number[]>;
  queries: Record<string, number[]>;
};

const CACHE_PATH = resolve(import.meta.dirname, 'embeddings.json');

let cache: EmbeddingCache | null = null;

export function loadEmbeddingCache(): EmbeddingCache {
  if (!cache) {
    try {
      cache = JSON.parse(readFileSync(CACHE_PATH, 'utf8')) as EmbeddingCache;
    } catch {
      throw new Error(
        'Missing src/fixtures/embeddings.json. Run `npm run embed:fixtures` once (needs OPENAI_API_KEY).',
      );
    }
  }
  return cache;
}

export function embeddedFixtures(): RemedyEntry[] {
  const { remedies } = loadEmbeddingCache();
  return REMEDY_FIXTURES.map((remedy) => ({ ...remedy, embedding: remedies[remedy.id] }));
}

export function fixtureStore(): InMemoryRemedyStore {
  return new InMemoryRemedyStore(embeddedFixtures());
}

/**
 * Falls back to a live API call for queries outside the cached set, so the same
 * embedder works in tests (cache hit, offline) and in the CLI (cache miss).
 *
 * When a cache miss happens inside vitest AND no API key is configured, a
 * deterministic vector is derived from the query text instead of calling the
 * API. This keeps the suite runnable offline: no assertion in the suite depends
 * on the similarity values of an uncached string (tiebreak and ranking tests
 * use corpora with copied or irrelevant embeddings). Tests that DO assert on
 * real similarity semantics must embed cached strings — add new query strings
 * to src/fixtures/test-queries.ts and re-run `npm run embed:fixtures`.
 */
function offlineEmbedding(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIM);
  for (let i = 0; i < EMBEDDING_DIM; i += 1) {
    const digest = createHash('sha256').update(`${EMBEDDING_MODEL}:${text}:${i}`).digest();
    vector[i] = digest.readInt16BE(0) / 32768;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return vector.map((value) => value / (norm || 1));
}

export async function cachedEmbedQuery(text: string): Promise<number[]> {
  const { queries } = loadEmbeddingCache();
  const cached = queries[text];
  if (cached) return cached;

  if (process.env.OPENAI_API_KEY) return embedText(text);

  if (process.env.VITEST) {
    return offlineEmbedding(text);
  }

  throw new Error(
    `No cached embedding for ${JSON.stringify(text)} and OPENAI_API_KEY is not set. ` +
      'Add the string to src/fixtures/test-queries.ts, run `npm run embed:fixtures` ' +
      'once with the key, and import the constant in the test.',
  );
}
