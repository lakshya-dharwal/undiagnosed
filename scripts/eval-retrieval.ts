import 'dotenv/config';
import { cachedEmbedQuery, embeddedFixtures, fixtureStore } from '../src/fixtures/embedded-corpus.js';
import { EVAL_QUERIES, type EvalQuery } from '../src/fixtures/eval-queries.js';
import { extract } from '../src/lib/extraction.js';
import { retrieveRemedies } from '../src/lib/retrieval.js';

/**
 * Retrieval eval. Re-runnable: `npm run eval`.
 *
 * Relevance is judged against each query's ground-truth tags, NOT against the tags
 * the extractor produced. That is deliberate — if extraction mislabels a query,
 * every row it retrieves is off-target and precision must fall to show it.
 *
 * precision@k is scored over min(k, returned) rather than k, because a symptom with
 * only two tagged remedies cannot fill five slots and should not be punished for it.
 */

const PASS_P3 = 0.67;
const PASS_P5 = 0.6;

type QueryReport = {
  query: EvalQuery;
  status: string;
  returned: string[];
  extractedTags: string[];
  p3: number | null;
  p5: number | null;
  mustIncludeMisses: string[];
  passed: boolean;
  notes: string[];
};

function precisionAt(names: string[], relevant: Set<string>, k: number): number | null {
  const slice = names.slice(0, k);
  if (slice.length === 0) return null;
  const hits = slice.filter((name) => relevant.has(name)).length;
  return hits / slice.length;
}

async function evaluate(item: EvalQuery): Promise<QueryReport> {
  const corpus = embeddedFixtures();
  const store = fixtureStore();
  const extraction = extract(item.query);
  const extractedTags = extraction.symptoms.map((symptom) => symptom.tag);

  const outcome = await retrieveRemedies({
    query: item.query,
    tags: extractedTags,
    store,
    embedQuery: cachedEmbedQuery,
    extraction,
  });

  const returned = outcome.remedies.map((remedy) => remedy.name);
  const notes: string[] = [];

  // Ground truth: any remedy tagged with any expected tag.
  const relevant = new Set(
    corpus
      .filter((remedy) => remedy.symptom_tags.some((tag) => item.expectedTags.includes(tag as never)))
      .map((remedy) => remedy.name),
  );

  if (item.expectedTags.length === 0) {
    const passed = outcome.status === 'no_tag_match' && returned.length === 0;
    if (!passed) notes.push(`expected graceful empty, got ${outcome.status} with ${returned.length} results`);
    return {
      query: item,
      status: outcome.status,
      returned,
      extractedTags,
      p3: null,
      p5: null,
      mustIncludeMisses: [],
      passed,
      notes,
    };
  }

  const p3 = precisionAt(returned, relevant, 3);
  const p5 = precisionAt(returned, relevant, 5);
  const mustIncludeMisses = (item.mustIncludeNames ?? []).filter((name) => !returned.includes(name));

  const missingTags = item.expectedTags.filter((tag) => !extractedTags.includes(tag));
  if (missingTags.length > 0) notes.push(`extraction missed: ${missingTags.join(', ')}`);

  const spuriousTags = extractedTags.filter((tag) => !item.expectedTags.includes(tag));
  if (spuriousTags.length > 0) notes.push(`extraction added: ${spuriousTags.join(', ')}`);

  if (mustIncludeMisses.length > 0) notes.push(`missing required: ${mustIncludeMisses.join(', ')}`);
  if (returned.length === 0) notes.push('no results returned');

  const passed =
    returned.length > 0 &&
    (p3 ?? 0) >= PASS_P3 &&
    (p5 ?? 0) >= PASS_P5 &&
    mustIncludeMisses.length === 0;

  return { query: item, status: outcome.status, returned, extractedTags, p3, p5, mustIncludeMisses, passed, notes };
}

function fmt(value: number | null): string {
  return value === null ? '  -  ' : value.toFixed(2).padStart(5);
}

async function main() {
  const reports: QueryReport[] = [];
  for (const item of EVAL_QUERIES) {
    reports.push(await evaluate(item));
  }

  console.log('\nRETRIEVAL EVAL\n');
  console.log(
    `${'id'.padEnd(5)} ${'style'.padEnd(14)} ${'p@3'.padEnd(6)} ${'p@5'.padEnd(6)} ${'result'.padEnd(7)} query`,
  );
  console.log('-'.repeat(110));

  for (const report of reports) {
    const verdict = report.passed ? 'PASS' : 'FAIL';
    console.log(
      `${report.query.id.padEnd(5)} ${report.query.style.padEnd(14)} ${fmt(report.p3)} ${fmt(report.p5)}  ${verdict.padEnd(7)} ${report.query.query.slice(0, 60)}`,
    );
    for (const note of report.notes) console.log(`${' '.repeat(6)}! ${note}`);
  }

  const scored = reports.filter((report) => report.p3 !== null);
  const meanP3 = scored.reduce((sum, r) => sum + (r.p3 ?? 0), 0) / scored.length;
  const meanP5 = scored.reduce((sum, r) => sum + (r.p5 ?? 0), 0) / scored.length;
  const passes = reports.filter((report) => report.passed).length;

  console.log('-'.repeat(110));
  console.log(`\nmean p@3: ${meanP3.toFixed(3)}   mean p@5: ${meanP5.toFixed(3)}`);
  console.log(`passed:   ${passes}/${reports.length}`);

  const byStyle = new Map<string, QueryReport[]>();
  for (const report of reports) {
    byStyle.set(report.query.style, [...(byStyle.get(report.query.style) ?? []), report]);
  }
  console.log('\nby style:');
  for (const [style, group] of byStyle) {
    const stylePasses = group.filter((report) => report.passed).length;
    console.log(`  ${style.padEnd(14)} ${stylePasses}/${group.length}`);
  }

  console.log('');
  if (passes < reports.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
