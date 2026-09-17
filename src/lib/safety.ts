import type { EvidenceLevel, SafeRemedy, ScoredRemedy } from './types.js';

/** PLACEHOLDER COPY — replace with the content lead's wording before demo. */
export const DISCLAIMER =
  'This is information to discuss with a clinician, not a diagnosis or a treatment plan.';

const VALID_EVIDENCE_LEVELS: EvidenceLevel[] = ['strong', 'moderate', 'early'];

export type SafetyViolation =
  | 'missing_source'
  | 'missing_evidence_level'
  | 'invalid_evidence_level'
  | 'missing_disclaimer'
  | 'missing_explanation'
  | 'diagnostic_claim';

export type SafetyCheck = {
  ok: boolean;
  violations: SafetyViolation[];
};

const CONDITIONS = String.raw`endometriosis|endo|adenomyosis|pcos|pmdd|fibroids`;

/**
 * Backstop only. The real control is that remedy copy is human-authored and
 * rendered verbatim, so there is no generation step that could produce a
 * diagnosis. This catches the case where that rule gets broken upstream.
 */
const DIAGNOSTIC_PATTERNS: RegExp[] = [
  new RegExp(String.raw`\byou (?:have|'ve got|are suffering from|likely have|probably have)\b[^.!?]{0,40}\b(?:${CONDITIONS})\b`, 'i'),
  new RegExp(String.raw`\b(?:this|that|it)(?:'s| is)\s+(?:definitely\s+|clearly\s+|almost certainly\s+)?(?:${CONDITIONS})\b`, 'i'),
  new RegExp(String.raw`\byou (?:are|'re) diagnosed\b`, 'i'),
  new RegExp(String.raw`\bconfirms? (?:that )?you\b`, 'i'),
  new RegExp(String.raw`\b(?:your|the) diagnosis is\b`, 'i'),
];

export function containsDiagnosticClaim(text: string): boolean {
  return DIAGNOSTIC_PATTERNS.some((pattern) => pattern.test(text));
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function checkRemedySafety(remedy: Partial<SafeRemedy>): SafetyCheck {
  const violations: SafetyViolation[] = [];

  if (!isNonEmpty(remedy.source)) violations.push('missing_source');

  if (!isNonEmpty(remedy.evidence_level)) {
    violations.push('missing_evidence_level');
  } else if (!VALID_EVIDENCE_LEVELS.includes(remedy.evidence_level as EvidenceLevel)) {
    violations.push('invalid_evidence_level');
  }

  if (!isNonEmpty(remedy.disclaimer)) violations.push('missing_disclaimer');
  if (!isNonEmpty(remedy.explanation_text)) violations.push('missing_explanation');

  if (isNonEmpty(remedy.explanation_text) && containsDiagnosticClaim(remedy.explanation_text)) {
    violations.push('diagnostic_claim');
  }

  return { ok: violations.length === 0, violations };
}

export function attachDisclaimer(remedy: ScoredRemedy): ScoredRemedy & { disclaimer: string } {
  return { ...remedy, disclaimer: DISCLAIMER };
}

export type SafetyGateResult = {
  safe: SafeRemedy[];
  blocked: Array<{ remedy: Partial<SafeRemedy>; violations: SafetyViolation[] }>;
};

/**
 * Hard gate: nothing reaches the UI without source + evidence_level + disclaimer.
 * Enforced here in code rather than asked for in a prompt, per docs/MEDICAL_SAFETY.md.
 */
export function enforceRemedySafety(remedies: ScoredRemedy[]): SafetyGateResult {
  const safe: SafeRemedy[] = [];
  const blocked: SafetyGateResult['blocked'] = [];

  for (const remedy of remedies) {
    const candidate = attachDisclaimer(remedy);
    const check = checkRemedySafety(candidate);
    if (check.ok) safe.push(candidate as SafeRemedy);
    else blocked.push({ remedy: candidate, violations: check.violations });
  }

  return { safe, blocked };
}
