import 'dotenv/config';
import { cachedEmbedQuery, fixtureStore } from '../src/fixtures/embedded-corpus.js';
import { EVAL_QUERIES } from '../src/fixtures/eval-queries.js';
import { extract } from '../src/lib/extraction.js';
import { retrieveRemedies } from '../src/lib/retrieval.js';
import { SupabaseRemedyStore, createSupabaseClient } from '../src/lib/store.js';

/**
 * The eval runs against the in-memory store; production runs against pgvector.
 * If those two disagree, a passing eval says nothing about what users see.
 * This checks they return the same remedies in the same order for every query.
 *
 * Requires a database loaded via `npm run embed -- --fixtures`.
 */
async function main() {
  const client = createSupabaseClient();
  const sqlStore = new SupabaseRemedyStore(client);
  const memoryStore = fixtureStore();

  let mismatches = 0;

  for (const item of EVAL_QUERIES) {
    const extraction = extract(item.query);
    const tags = extraction.symptoms.map((symptom) => symptom.tag);

    const [sql, memory] = await Promise.all([
      retrieveRemedies({ query: item.query, tags, store: sqlStore, embedQuery: cachedEmbedQuery, extraction }),
      retrieveRemedies({ query: item.query, tags, store: memoryStore, embedQuery: cachedEmbedQuery, extraction }),
    ]);

    const sqlNames = sql.remedies.map((remedy) => remedy.name);
    const memoryNames = memory.remedies.map((remedy) => remedy.name);
    const same = JSON.stringify(sqlNames) === JSON.stringify(memoryNames);

    if (!same) {
      mismatches++;
      console.log(`${item.id} MISMATCH`);
      console.log(`  sql:    ${sqlNames.join(', ') || '(none)'}`);
      console.log(`  memory: ${memoryNames.join(', ') || '(none)'}`);
    } else {
      console.log(`${item.id} ok  (${sqlNames.length} results)`);
    }
  }

  console.log(`\n${EVAL_QUERIES.length - mismatches}/${EVAL_QUERIES.length} queries match between pgvector and the in-memory store.`);
  if (mismatches > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
