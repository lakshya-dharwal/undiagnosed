import type { PatternResult, SymptomHistoryRow } from './types.js';

/**
 * Minimum least-squares slope (severity points per entry) to call a trend real.
 * At 0.3 a four-entry run has to move ~1 full severity point end-to-end, which is
 * the smallest change a person would actually notice.
 */
export const MIN_SLOPE = 0.3;

/** Fewer than this many entries and any "trend" is just two points of noise. */
export const MIN_ENTRIES = 3;

function leastSquaresSlope(values: number[]): number {
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - meanX) * (values[i] - meanY);
    denominator += (i - meanX) ** 2;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Deterministic trend detection. No ML.
 *
 * Uses least-squares slope rather than a strict "every value is higher than the
 * last" check so one bad-then-better day does not erase a real escalation.
 *
 * `detected` means a directional trend exists (rising or falling). Callers that
 * specifically care about escalation should test `pattern === 'increasing_severity'`.
 */
export function detectPattern(values: number[], symptom: string): PatternResult {
  const dips = values.reduce(
    (count, value, i) => (i > 0 && value < values[i - 1] ? count + 1 : count),
    0,
  );

  if (values.length < MIN_ENTRIES) {
    return {
      pattern: 'insufficient_data',
      symptom,
      values,
      detected: false,
      slope: 0,
      netChange: 0,
      dips,
    };
  }

  const slope = leastSquaresSlope(values);
  const netChange = values[values.length - 1] - values[0];

  let pattern: PatternResult['pattern'] = 'stable';
  if (slope >= MIN_SLOPE) pattern = 'increasing_severity';
  else if (slope <= -MIN_SLOPE) pattern = 'decreasing_severity';

  return {
    pattern,
    symptom,
    values,
    detected: pattern === 'increasing_severity' || pattern === 'decreasing_severity',
    slope: Number(slope.toFixed(3)),
    netChange,
    dips,
  };
}

/** Orders a persona's history for one symptom and appends today's reading. */
export function severitySeries(
  history: SymptomHistoryRow[],
  symptom: string,
  todaySeverity?: number | null,
): number[] {
  const values = history
    .filter((row) => row.symptom === symptom)
    .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())
    .map((row) => row.severity);

  if (typeof todaySeverity === 'number') values.push(todaySeverity);
  return values;
}
