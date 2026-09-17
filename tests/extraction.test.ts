import { describe, expect, it } from 'vitest';
import { EVAL_QUERIES } from '../src/fixtures/eval-queries.js';
import { extract, extractFunctionalImpact, extractSeverity } from '../src/lib/extraction.js';

describe('extract, across the eval query set', () => {
  it.each(EVAL_QUERIES)('$id ($style): $query', (item) => {
    const result = extract(item.query);
    const tags = result.symptoms.map((symptom) => symptom.tag);

    expect(tags).toEqual(expect.arrayContaining(item.expectedTags));

    if (item.expectedTags.length === 0) {
      expect(tags).toHaveLength(0);
    } else {
      expect(result.primary?.tag).toBe(item.expectedTags[0]);
      // No spurious tags: a wrong tag silently retrieves the wrong remedies.
      expect(tags).toHaveLength(item.expectedTags.length);
    }

    if (item.expectedSeverity !== undefined) {
      expect(result.severity).toBe(item.expectedSeverity);
    }

    for (const impact of item.expectedImpact ?? []) {
      expect(result.functional_impact[impact]).toBe(true);
    }
  });
});

describe('extractSeverity', () => {
  it.each([
    ['probably an 8 out of 10', 8],
    ['a solid 9/10 today', 9],
    ['like a 6', 6],
    ['pain is at a 4', 4],
    ['it was unbearable', 9],
    ['horrible cramps', 8],
    ['pretty mild honestly', 3],
  ])('reads "%s" as %i', (text, expected) => {
    expect(extractSeverity(text)).toBe(expected);
  });

  it('prefers an explicit number over an intensity word', () => {
    expect(extractSeverity('horrible cramps, probably a 6 out of 10')).toBe(6);
  });

  it('returns null when no severity is stated', () => {
    expect(extractSeverity('my stomach feels weird')).toBeNull();
  });

  it('ignores numbers that are clearly not severities', () => {
    expect(extractSeverity('it started around 7 pm')).toBeNull();
    expect(extractSeverity('this has gone on for 3 days')).toBeNull();
  });

  it('rejects out-of-range values', () => {
    expect(extractSeverity('a 47')).toBeNull();
  });
});

describe('extractFunctionalImpact', () => {
  it.each([
    ["I couldn't go to work", 'missed_work'],
    ['called out sick again', 'missed_work'],
    ['missed class this morning', 'missed_school'],
    ["couldn't get out of bed", 'bedbound'],
    ['had to cancel plans', 'cancelled_plans'],
    ['ended up in urgent care', 'er_visit'],
  ] as const)('reads "%s" as %s', (text, key) => {
    expect(extractFunctionalImpact(text)[key]).toBe(true);
  });

  it('captures more than one impact from one sentence', () => {
    const impact = extractFunctionalImpact("missed work and couldn't get out of bed all day");
    expect(impact.missed_work).toBe(true);
    expect(impact.bedbound).toBe(true);
  });

  it('returns an empty object when nothing is stated', () => {
    expect(extractFunctionalImpact('cramps are bad today')).toEqual({});
  });
});

describe('typo tolerance boundaries', () => {
  it('matches common misspellings', () => {
    expect(extract('my cramsp hurt').symptoms[0]?.tag).toBe('pelvic_pain');
    expect(extract('feeling bloted').symptoms[0]?.tag).toBe('bloating');
  });

  it('does not cross-match words that are close but tag different symptoms', () => {
    // "clotting" (heavy_bleeding) and "bloating" are two edits apart.
    const tags = extract('menorrhagia with clotting').symptoms.map((symptom) => symptom.tag);
    expect(tags).toContain('heavy_bleeding');
    expect(tags).not.toContain('bloating');
  });

  it('does not fuzzy-match short words', () => {
    expect(extract('my bad knee is acting up').symptoms).toHaveLength(0);
  });
});
