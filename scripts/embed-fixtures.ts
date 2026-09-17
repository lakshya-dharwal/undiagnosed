import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { embedBatch } from '../src/lib/embeddings.js';
import { EVAL_QUERIES } from '../src/fixtures/eval-queries.js';
import { REMEDY_FIXTURES } from '../src/fixtures/remedies.js';

/**
 * Embeds the fixture corpus and the eval query set once, then caches the vectors
 * to disk. Tests and evals read the cache, so they are deterministic, free and
 * runnable offline; only this script needs the API key.
 *
 * Re-run after editing fixture explanation_text or eval queries.
 */
const OUTPUT_PATH = resolve(import.meta.dirname, '../src/fixtures/embeddings.json');

async function main() {
  const remedyTexts = REMEDY_FIXTURES.map((remedy) => remedy.explanation_text);
  const queryTexts = EVAL_QUERIES.map((item) => item.query);

  console.log(`Embedding ${remedyTexts.length} remedies and ${queryTexts.length} queries...`);

  const [remedyVectors, queryVectors] = await Promise.all([
    embedBatch(remedyTexts),
    embedBatch(queryTexts),
  ]);

  const cache = {
    model: 'text-embedding-3-small',
    generatedAt: new Date().toISOString(),
    remedies: Object.fromEntries(
      REMEDY_FIXTURES.map((remedy, i) => [remedy.id, remedyVectors[i]]),
    ),
    queries: Object.fromEntries(EVAL_QUERIES.map((item, i) => [item.query, queryVectors[i]])),
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(cache));
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
