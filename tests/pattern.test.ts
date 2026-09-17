import { describe, expect, it } from 'vitest';
import { detectPattern, severitySeries } from '../src/lib/pattern.js';
import { SEEDED_HISTORY } from '../src/fixtures/symptom-history.js';

describe('detectPattern', () => {
  it('detects a clean rising trend', () => {
    const result = detectPattern([5, 6, 7, 8], 'pelvic_pain');

    expect(result.pattern).toBe('increasing_severity');
    expect(result.detected).toBe(true);
    expect(result.slope).toBeCloseTo(1, 3);
    expect(result.netChange).toBe(3);
    expect(result.dips).toBe(0);
  });

  it('still detects a rising trend through a single dip', () => {
    const result = detectPattern([5, 7, 6, 8], 'pelvic_pain');

    expect(result.pattern).toBe('increasing_severity');
    expect(result.detected).toBe(true);
    expect(result.dips).toBe(1);
  });

  it('does not flag a flat trend', () => {
    const result = detectPattern([5, 5, 5, 5], 'pelvic_pain');

    expect(result.pattern).toBe('stable');
    expect(result.detected).toBe(false);
    expect(result.slope).toBe(0);
  });

  it('does not flag noise around a stable level as a trend', () => {
    const result = detectPattern([6, 5, 6, 5, 6], 'bloating');

    expect(result.pattern).toBe('stable');
    expect(result.detected).toBe(false);
  });

  it('identifies a declining trend separately from a rising one', () => {
    const result = detectPattern([8, 7, 6, 5], 'pelvic_pain');

    expect(result.pattern).toBe('decreasing_severity');
    expect(result.detected).toBe(true);
    expect(result.slope).toBeCloseTo(-1, 3);
  });

  it('refuses to call a trend from fewer than three entries', () => {
    const result = detectPattern([4, 9], 'pelvic_pain');

    expect(result.pattern).toBe('insufficient_data');
    expect(result.detected).toBe(false);
  });

  it('handles an empty series', () => {
    const result = detectPattern([], 'pelvic_pain');

    expect(result.pattern).toBe('insufficient_data');
    expect(result.values).toEqual([]);
  });
});

describe('severitySeries', () => {
  it('orders seeded history chronologically and appends today', () => {
    expect(severitySeries(SEEDED_HISTORY, 'pelvic_pain', 8)).toEqual([5, 6, 7, 8]);
  });

  it('ignores other symptoms', () => {
    expect(severitySeries(SEEDED_HISTORY, 'bloating', 4)).toEqual([4]);
  });

  it('omits today when no severity was stated', () => {
    expect(severitySeries(SEEDED_HISTORY, 'pelvic_pain', null)).toEqual([5, 6, 7]);
  });

  it('sorts out-of-order rows before computing', () => {
    const shuffled = [SEEDED_HISTORY[2], SEEDED_HISTORY[0], SEEDED_HISTORY[1]];
    expect(severitySeries(shuffled, 'pelvic_pain')).toEqual([5, 6, 7]);
  });
});
