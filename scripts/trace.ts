import 'dotenv/config';
import { cachedEmbedQuery, fixtureStore } from '../src/fixtures/embedded-corpus.js';
import { extract } from '../src/lib/extraction.js';
import { retrieveRemedies } from '../src/lib/retrieval.js';
import { formatTrace } from '../src/lib/tracing.js';

/** Usage: npm run trace -- "my cramps are horrible today, probably an 8" */
async function main() {
  const query = process.argv.slice(2).join(' ').trim();
  if (!query) {
    console.error('Usage: npm run trace -- "<symptom text>"');
    process.exit(1);
  }

  const extraction = extract(query);
  const outcome = await retrieveRemedies({
    query,
    tags: extraction.symptoms.map((symptom) => symptom.tag),
    store: fixtureStore(),
    embedQuery: cachedEmbedQuery,
    extraction,
  });

  console.log('');
  console.log(formatTrace(outcome.trace, extraction));
  console.log('');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
