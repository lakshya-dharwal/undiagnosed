import { describe, expect, it } from 'vitest';
import { cachedEmbedQuery, fixtureStore } from '../src/fixtures/embedded-corpus.js';
import { REMEDY_FIXTURES } from '../src/fixtures/remedies.js';
import { DEMO_PERSONA_ID, SEEDED_HISTORY } from '../src/fixtures/symptom-history.js';
import { runPipeline } from '../src/lib/pipeline.js';
import { containsDiagnosticClaim } from '../src/lib/safety.js';
import { renderVisitReportText } from '../src/lib/visit-report.js';

/** The demo script anchor from docs/DEMO.md, asserted line by line. */
const DEMO_QUERY =
  "my cramps are horrible again today, probably an 8 out of 10, and I couldn't go to work";

async function runGoldenPath() {
  return runPipeline({
    text: DEMO_QUERY,
    personaId: DEMO_PERSONA_ID,
    loadHistory: async () => SEEDED_HISTORY,
    store: fixtureStore(),
    embedQuery: cachedEmbedQuery,
  });
}

describe('golden path', () => {
  it('accepts the symptom input', async () => {
    const result = await runGoldenPath();
    expect(result.extraction.rawText).toBe(DEMO_QUERY);
  });

  it('extracts pelvic_pain with severity 8', async () => {
    const result = await runGoldenPath();

    expect(result.extraction.primary?.tag).toBe('pelvic_pain');
    expect(result.extraction.severity).toBe(8);
  });

  it('captures missed_work', async () => {
    const result = await runGoldenPath();
    expect(result.extraction.functional_impact.missed_work).toBe(true);
  });

  it('retrieves the seeded history as 5, 6, 7 and appends today', async () => {
    const result = await runGoldenPath();
    expect(result.pattern.values).toEqual([5, 6, 7, 8]);
  });

  it('detects increasing_severity', async () => {
    const result = await runGoldenPath();

    expect(result.pattern.pattern).toBe('increasing_severity');
    expect(result.pattern.detected).toBe(true);
  });

  it('returns 3 to 5 tag-filtered, similarity-ranked remedies', async () => {
    const result = await runGoldenPath();

    expect(result.remedies.length).toBeGreaterThanOrEqual(3);
    expect(result.remedies.length).toBeLessThanOrEqual(5);

    for (const remedy of result.remedies) {
      expect(remedy.symptom_tags).toContain('pelvic_pain');
    }

    const scores = result.remedies.map((remedy) => remedy.similarity);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('gives every remedy a source, evidence level and disclaimer', async () => {
    const result = await runGoldenPath();

    for (const remedy of result.remedies) {
      expect(remedy.source.trim()).not.toBe('');
      expect(['strong', 'moderate', 'early']).toContain(remedy.evidence_level);
      expect(remedy.disclaimer.trim()).not.toBe('');
    }

    expect(result.blocked).toHaveLength(0);
  });

  it('renders the human-authored explanation verbatim', async () => {
    const result = await runGoldenPath();

    for (const remedy of result.remedies) {
      const original = REMEDY_FIXTURES.find((fixture) => fixture.id === remedy.id);
      expect(remedy.explanation_text).toBe(original?.explanation_text);
    }
  });

  it('produces no diagnostic claim anywhere in the output', async () => {
    const result = await runGoldenPath();
    const text = renderVisitReportText(result.report);

    expect(containsDiagnosticClaim(text)).toBe(false);
  });

  it('generates a Visit Report with the correct pattern values and remedy list', async () => {
    const result = await runGoldenPath();
    const { report } = result;

    const patternSection = report.sections.find((section) => section.kind === 'pattern');
    expect(patternSection).toBeDefined();
    if (patternSection?.kind !== 'pattern') throw new Error('unreachable');
    expect(patternSection.values).toEqual([5, 6, 7, 8]);
    expect(patternSection.body).toContain('5 → 6 → 7 → 8');

    const remedySection = report.sections.find((section) => section.kind === 'remedies');
    if (remedySection?.kind !== 'remedies') throw new Error('unreachable');
    expect(remedySection.items.map((item) => item.id)).toEqual(
      result.remedies.map((remedy) => remedy.id),
    );

    const impactSection = report.sections.find((section) => section.kind === 'impact');
    if (impactSection?.kind !== 'impact') throw new Error('unreachable');
    expect(impactSection.items).toContain('Missed a day of work');

    const questionSection = report.sections.find((section) => section.kind === 'questions');
    if (questionSection?.kind !== 'questions') throw new Error('unreachable');
    expect(questionSection.items.length).toBeGreaterThan(0);

    expect(report.blockedRemedyCount).toBe(0);
    expect(report.personaId).toBe(DEMO_PERSONA_ID);
  });

  it('renders a report containing every source', async () => {
    const result = await runGoldenPath();
    const text = renderVisitReportText(result.report);

    for (const remedy of result.remedies) {
      expect(text).toContain(remedy.source);
      expect(text).toContain(remedy.explanation_text);
    }
  });
});
