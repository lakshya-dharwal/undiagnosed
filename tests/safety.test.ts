import { describe, expect, it } from 'vitest';
import {
  DISCLAIMER,
  checkRemedySafety,
  containsDiagnosticClaim,
  enforceRemedySafety,
} from '../src/lib/safety.js';
import type { ScoredRemedy } from '../src/lib/types.js';

const baseRemedy: ScoredRemedy = {
  id: 'test-1',
  name: 'Heat therapy',
  symptom_tags: ['pelvic_pain'],
  explanation_text: 'A heating pad on your lower abdomen relaxes the muscle that is cramping.',
  source: 'Cochrane Database of Systematic Reviews',
  evidence_level: 'moderate',
  caution: null,
  similarity: 0.5,
};

describe('checkRemedySafety', () => {
  it('passes a complete remedy', () => {
    expect(checkRemedySafety({ ...baseRemedy, disclaimer: DISCLAIMER })).toEqual({
      ok: true,
      violations: [],
    });
  });

  it('blocks a missing source', () => {
    const check = checkRemedySafety({ ...baseRemedy, source: '', disclaimer: DISCLAIMER });
    expect(check.ok).toBe(false);
    expect(check.violations).toContain('missing_source');
  });

  it('blocks a whitespace-only source', () => {
    const check = checkRemedySafety({ ...baseRemedy, source: '   ', disclaimer: DISCLAIMER });
    expect(check.violations).toContain('missing_source');
  });

  it('blocks a missing evidence level', () => {
    const check = checkRemedySafety({
      ...baseRemedy,
      evidence_level: undefined as never,
      disclaimer: DISCLAIMER,
    });
    expect(check.violations).toContain('missing_evidence_level');
  });

  it('blocks an evidence level outside the allowed set', () => {
    const check = checkRemedySafety({
      ...baseRemedy,
      evidence_level: 'proven' as never,
      disclaimer: DISCLAIMER,
    });
    expect(check.violations).toContain('invalid_evidence_level');
  });

  it('blocks a missing disclaimer', () => {
    const check = checkRemedySafety({ ...baseRemedy });
    expect(check.violations).toContain('missing_disclaimer');
  });

  it('blocks a missing explanation', () => {
    const check = checkRemedySafety({
      ...baseRemedy,
      explanation_text: '',
      disclaimer: DISCLAIMER,
    });
    expect(check.violations).toContain('missing_explanation');
  });

  it('reports every violation at once rather than the first', () => {
    const check = checkRemedySafety({ ...baseRemedy, source: '', evidence_level: undefined as never });
    expect(check.violations).toEqual(
      expect.arrayContaining(['missing_source', 'missing_evidence_level', 'missing_disclaimer']),
    );
  });
});

describe('containsDiagnosticClaim', () => {
  it.each([
    'You have endometriosis based on this pattern.',
    "This is definitely endometriosis.",
    'Your diagnosis is adenomyosis.',
    'This confirms you are dealing with PCOS.',
  ])('flags a diagnostic claim: %s', (text) => {
    expect(containsDiagnosticClaim(text)).toBe(true);
  });

  it.each([
    'This is a pattern worth discussing with a clinician, not a diagnosis.',
    'You have options here, and none of them are all-or-nothing.',
    'Many people with endometriosis find heat helps the cramping.',
    'Ask what would need to be ruled out before a diagnosis is considered.',
  ])('does not flag safe copy: %s', (text) => {
    expect(containsDiagnosticClaim(text)).toBe(false);
  });

  it('blocks a remedy whose explanation makes a diagnostic claim', () => {
    const check = checkRemedySafety({
      ...baseRemedy,
      explanation_text: 'Heat helps because you have endometriosis.',
      disclaimer: DISCLAIMER,
    });
    expect(check.violations).toContain('diagnostic_claim');
  });
});

describe('enforceRemedySafety', () => {
  it('attaches the disclaimer and lets complete remedies through', () => {
    const { safe, blocked } = enforceRemedySafety([baseRemedy]);

    expect(blocked).toHaveLength(0);
    expect(safe).toHaveLength(1);
    expect(safe[0].disclaimer).toBe(DISCLAIMER);
  });

  it('separates unsafe remedies from safe ones instead of failing the batch', () => {
    const unsourced = { ...baseRemedy, id: 'test-2', name: 'Mystery tea', source: '' };
    const { safe, blocked } = enforceRemedySafety([baseRemedy, unsourced]);

    expect(safe.map((remedy) => remedy.id)).toEqual(['test-1']);
    expect(blocked).toHaveLength(1);
    expect(blocked[0].violations).toContain('missing_source');
  });

  it('never returns a remedy missing any of the three required fields', () => {
    const broken: ScoredRemedy[] = [
      { ...baseRemedy, id: 'a', source: '' },
      { ...baseRemedy, id: 'b', evidence_level: '' as never },
      { ...baseRemedy, id: 'c', explanation_text: '' },
    ];

    const { safe } = enforceRemedySafety(broken);
    expect(safe).toHaveLength(0);
  });
});
