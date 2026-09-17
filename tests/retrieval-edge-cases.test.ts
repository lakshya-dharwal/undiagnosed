import { describe, expect, it } from 'vitest';
import { cachedEmbedQuery, embeddedFixtures, fixtureStore } from '../src/fixtures/embedded-corpus.js';
import { EDGE_TEST_QUERIES } from '../src/fixtures/test-queries.js';
import { extract } from '../src/lib/extraction.js';
import {
  PRIMARY_TAG_WEIGHT,
  SECONDARY_TAG_WEIGHT,
  retrieveFromText,
  retrieveRemedies,
} from '../src/lib/retrieval.js';
import { InMemoryRemedyStore } from '../src/lib/store.js';

const embed = cachedEmbedQuery;

describe('edge case: query mentions multiple symptoms', () => {
  const query = 'cramps and bloating both terrible today, had to cancel plans';

  it('weights the first-named symptom above the others', async () => {
    const outcome = await retrieveFromText(query, fixtureStore(), embed);

    expect(outcome.trace.extractedTags[0]).toMatchObject({
      tag: 'pelvic_pain',
      weight: PRIMARY_TAG_WEIGHT,
    });
    expect(outcome.trace.extractedTags[1]).toMatchObject({
      tag: 'bloating',
      weight: SECONDARY_TAG_WEIGHT,
    });
  });

  it('still surfaces secondary-symptom remedies rather than dropping them', async () => {
    const outcome = await retrieveFromText(query, fixtureStore(), embed);
    const tags = outcome.remedies.flatMap((remedy) => remedy.symptom_tags);

    expect(tags).toContain('pelvic_pain');
  });

  it('applies the secondary weight to secondary-only remedies', async () => {
    const outcome = await retrieveFromText(query, fixtureStore(), embed);
    const bloatingOnly = outcome.trace.candidates.filter(
      (candidate) => !candidate.symptom_tags.includes('pelvic_pain'),
    );

    for (const candidate of bloatingOnly) {
      expect(candidate.tagWeight).toBe(SECONDARY_TAG_WEIGHT);
      expect(candidate.score).toBeCloseTo(candidate.baseSimilarity * SECONDARY_TAG_WEIGHT, 3);
    }
  });
});

describe('edge case: symptom has no tagged remedies', () => {
  it('returns a graceful empty state, not unrelated results', async () => {
    const outcome = await retrieveRemedies({
      query: EDGE_TEST_QUERIES.tinnitus,
      tags: ['tinnitus'],
      store: fixtureStore(),
      embedQuery: embed,
    });

    expect(outcome.remedies).toHaveLength(0);
    expect(outcome.status).toBe('no_remedies_for_tag');
    expect(outcome.message).toBeTruthy();
    expect(outcome.trace.survivedTagFilter).toBe(0);
  });
});

describe('edge case: phrasing matches no tag vocabulary', () => {
  it('returns empty with a clarifying status rather than guessing', async () => {
    const outcome = await retrieveFromText(
      'I just feel off lately and I wanted to write it down',
      fixtureStore(),
      embed,
    );

    expect(outcome.status).toBe('no_tag_match');
    expect(outcome.remedies).toHaveLength(0);
  });

  it('never falls back to unfiltered vector search', async () => {
    const outcome = await retrieveFromText('honestly everything has felt wrong', fixtureStore(), embed);

    // An unfiltered fallback would return the nearest rows regardless of tag,
    // which on an 18-row corpus is confident nonsense.
    expect(outcome.trace.candidates).toHaveLength(0);
    expect(outcome.trace.survivedTagFilter).toBe(0);
  });
});

describe('edge case: tag filter returns fewer than topK', () => {
  it('returns the smaller set instead of loosening the filter', async () => {
    const outcome = await retrieveRemedies({
      query: EDGE_TEST_QUERIES.painfulSex,
      tags: ['painful_sex'],
      store: fixtureStore(),
      embedQuery: embed,
      topK: 5,
    });

    expect(outcome.remedies.length).toBeLessThan(5);
    expect(outcome.status).toBe('fewer_than_requested');

    for (const remedy of outcome.remedies) {
      expect(remedy.symptom_tags).toContain('painful_sex');
    }
  });

  it('reports ok when the filter can fill every slot', async () => {
    const outcome = await retrieveRemedies({
      query: EDGE_TEST_QUERIES.pelvicPain,
      tags: ['pelvic_pain'],
      store: fixtureStore(),
      embedQuery: embed,
      topK: 5,
    });

    expect(outcome.remedies).toHaveLength(5);
    expect(outcome.status).toBe('ok');
  });
});

describe('edge case: near-identical similarity scores', () => {
  it('breaks ties by evidence level, strongest first', async () => {
    const corpus = embeddedFixtures();
    const template = corpus.find((remedy) => remedy.name === 'Heat therapy');
    if (!template) throw new Error('fixture missing');

    // Same embedding on every row forces an exact tie so the tiebreak is the
    // only thing that can decide the order.
    const tied = (['early', 'strong', 'moderate'] as const).map((level, i) => ({
      ...template,
      id: `tie-${i}`,
      name: `Tied remedy ${level}`,
      evidence_level: level,
    }));

    const outcome = await retrieveRemedies({
      query: EDGE_TEST_QUERIES.cramps,
      tags: ['pelvic_pain'],
      store: new InMemoryRemedyStore(tied),
      embedQuery: embed,
      topK: 3,
    });

    expect(outcome.remedies.map((remedy) => remedy.evidence_level)).toEqual([
      'strong',
      'moderate',
      'early',
    ]);
    expect(outcome.trace.tiebreaks[0]).toMatchObject({ resolvedBy: 'evidence_level' });
  });

  it('falls back to a stable alphabetical order when evidence level also ties', async () => {
    const corpus = embeddedFixtures();
    const template = corpus.find((remedy) => remedy.name === 'Heat therapy');
    if (!template) throw new Error('fixture missing');

    const tied = ['Zinc', 'Aspirin', 'Magnesium'].map((name, i) => ({
      ...template,
      id: `same-${i}`,
      name,
      evidence_level: 'moderate' as const,
    }));

    const outcome = await retrieveRemedies({
      query: EDGE_TEST_QUERIES.cramps,
      tags: ['pelvic_pain'],
      store: new InMemoryRemedyStore(tied),
      embedQuery: embed,
      topK: 3,
    });

    expect(outcome.remedies.map((remedy) => remedy.name)).toEqual(['Aspirin', 'Magnesium', 'Zinc']);
  });
});

describe('trace completeness', () => {
  it('records every stage for a normal query', async () => {
    const query = "my cramps are horrible again today, probably an 8 out of 10, and I couldn't go to work";
    const extraction = extract(query);
    const outcome = await retrieveRemedies({
      query,
      tags: extraction.symptoms.map((symptom) => symptom.tag),
      store: fixtureStore(),
      embedQuery: embed,
      extraction,
    });

    expect(outcome.trace.corpusSize).toBe(18);
    expect(outcome.trace.survivedTagFilter).toBeGreaterThan(0);
    expect(outcome.trace.candidates.length).toBe(outcome.trace.survivedTagFilter);
    expect(outcome.trace.finalRanking).toHaveLength(5);

    for (const entry of outcome.trace.finalRanking) {
      expect(entry.reason).toMatch(/similarity .* x tag weight/);
    }
  });

  it('lists candidates in the same order as the returned remedies', async () => {
    const outcome = await retrieveFromText(EDGE_TEST_QUERIES.periodPainShort, fixtureStore(), embed);

    expect(outcome.trace.candidates.slice(0, outcome.remedies.length).map((c) => c.name)).toEqual(
      outcome.remedies.map((remedy) => remedy.name),
    );
  });
});
