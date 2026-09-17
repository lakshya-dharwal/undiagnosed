import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { embedText } from '../lib/embeddings.js';
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
 * Falls back to a live API call for queries outside the cached eval set, so the
 * same embedder works in tests (cache hit, offline) and in the CLI (cache miss).
 */
export async function cachedEmbedQuery(text: string): Promise<number[]> {
  const { queries } = loadEmbeddingCache();
  return queries[text] ?? (await embedText(text));
}
