import { DISCLAIMER, enforceRemedySafety } from './safety.js';
import type { FunctionalImpact, PatternResult, SafeRemedy, ScoredRemedy } from './types.js';

/**
 * PLACEHOLDER COPY THROUGHOUT — every string marked below is a stand-in for the
 * content lead's Visit Report wording. Values are interpolated into fixed
 * templates rather than generated, so nothing here is ever model-written
 * (docs/AGENT_RULES.md).
 */

export type VisitReportSection =
  | {
      kind: 'pattern';
      heading: string;
      body: string;
      symptom: string;
      values: number[];
      slope: number;
    }
  | { kind: 'impact'; heading: string; items: string[] }
  | { kind: 'remedies'; heading: string; items: SafeRemedy[] }
  | { kind: 'questions'; heading: string; items: string[] };

export type VisitReport = {
  title: string;
  generatedAt: string;
  personaId: string;
  disclaimer: string;
  sections: VisitReportSection[];
  blockedRemedyCount: number;
};

const IMPACT_LABELS: Record<keyof FunctionalImpact, string> = {
  missed_work: 'Missed a day of work',
  missed_school: 'Missed school or class',
  bedbound: 'Unable to get out of bed',
  cancelled_plans: 'Cancelled plans',
  er_visit: 'Went to the emergency room or urgent care',
};

/** PLACEHOLDER COPY. */
function patternBody(pattern: PatternResult): string {
  const readable = pattern.symptom.replace(/_/g, ' ');
  const series = pattern.values.join(' → ');

  if (pattern.pattern === 'increasing_severity') {
    return `Over the last ${pattern.values.length} check-ins, ${readable} has been recorded at ${series} out of 10. That is an upward trend of about ${pattern.slope.toFixed(2)} points per check-in. This is a pattern worth discussing, not a diagnosis.`;
  }

  if (pattern.pattern === 'decreasing_severity') {
    return `Over the last ${pattern.values.length} check-ins, ${readable} has been recorded at ${series} out of 10, trending downward by about ${Math.abs(pattern.slope).toFixed(2)} points per check-in.`;
  }

  if (pattern.pattern === 'stable') {
    return `Over the last ${pattern.values.length} check-ins, ${readable} has stayed around ${series} out of 10 without a clear direction.`;
  }

  return `There are only ${pattern.values.length} check-ins recorded for ${readable} so far, which is not yet enough to describe a trend.`;
}

/** PLACEHOLDER COPY. */
function questionsFor(pattern: PatternResult, impact: FunctionalImpact): string[] {
  const readable = pattern.symptom.replace(/_/g, ' ');
  const questions = [
    `My ${readable} has been getting worse over several months. What would you want to rule out first?`,
    'What would the next diagnostic step look like, and what does it involve?',
    'Which of the options below would you start with, and why that one?',
  ];

  if (impact.missed_work || impact.missed_school) {
    questions.push('This has started costing me days of work. Does that change what you would recommend?');
  }
  if (impact.er_visit) {
    questions.push('I have been to urgent care for this. Should that change the urgency of the workup?');
  }

  return questions;
}

export type BuildVisitReportArgs = {
  personaId: string;
  pattern: PatternResult;
  remedies: ScoredRemedy[];
  functionalImpact?: FunctionalImpact;
  generatedAt?: Date;
};

export function buildVisitReport(args: BuildVisitReportArgs): VisitReport {
  const { personaId, pattern, remedies, functionalImpact = {}, generatedAt = new Date() } = args;

  // Second safety pass. Retrieval already gates, but the report is the artifact
  // that leaves the app on paper, so it re-checks rather than trusting its input.
  const { safe, blocked } = enforceRemedySafety(remedies);

  const impactItems = (Object.keys(functionalImpact) as Array<keyof FunctionalImpact>)
    .filter((key) => functionalImpact[key])
    .map((key) => IMPACT_LABELS[key]);

  const sections: VisitReportSection[] = [
    {
      kind: 'pattern',
      heading: 'What my body has been doing', // PLACEHOLDER COPY
      body: patternBody(pattern),
      symptom: pattern.symptom,
      values: pattern.values,
      slope: pattern.slope,
    },
  ];

  if (impactItems.length > 0) {
    sections.push({
      kind: 'impact',
      heading: 'What it has cost me', // PLACEHOLDER COPY
      items: impactItems,
    });
  }

  sections.push(
    {
      kind: 'remedies',
      heading: 'What I have read about', // PLACEHOLDER COPY
      items: safe,
    },
    {
      kind: 'questions',
      heading: 'What I want to ask', // PLACEHOLDER COPY
      items: questionsFor(pattern, functionalImpact),
    },
  );

  return {
    title: 'Visit Report', // PLACEHOLDER COPY
    generatedAt: generatedAt.toISOString(),
    personaId,
    disclaimer: DISCLAIMER,
    sections,
    blockedRemedyCount: blocked.length,
  };
}

export function renderVisitReportText(report: VisitReport): string {
  const lines: string[] = [report.title, `Generated ${report.generatedAt}`, ''];

  for (const section of report.sections) {
    lines.push(section.heading.toUpperCase());

    if (section.kind === 'pattern') {
      lines.push(section.body);
    } else if (section.kind === 'remedies') {
      for (const remedy of section.items) {
        lines.push(`- ${remedy.name} [${remedy.evidence_level} evidence]`);
        lines.push(`  ${remedy.explanation_text}`);
        lines.push(`  Source: ${remedy.source}`);
        if (remedy.caution) lines.push(`  Caution: ${remedy.caution}`);
      }
    } else {
      for (const item of section.items) lines.push(`- ${item}`);
    }

    lines.push('');
  }

  lines.push(report.disclaimer);
  return lines.join('\n');
}
