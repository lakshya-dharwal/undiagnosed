import { extract } from './extraction.js';
import { detectPattern, severitySeries } from './pattern.js';
import { retrieveRemedies, type RetrievalOutcome } from './retrieval.js';
import { enforceRemedySafety } from './safety.js';
import type { RemedyStore } from './store.js';
import type { ExtractionResult, PatternResult, SafeRemedy, SymptomHistoryRow } from './types.js';
import { buildVisitReport, type VisitReport } from './visit-report.js';

export type PipelineArgs = {
  text: string;
  personaId: string;
  /** Called with the detected symptom, since which history matters is not known until extraction runs. */
  loadHistory: (symptom: string) => Promise<SymptomHistoryRow[]>;
  store: RemedyStore;
  embedQuery: (text: string) => Promise<number[]>;
  topK?: number;
};

export type PipelineResult = {
  extraction: ExtractionResult;
  pattern: PatternResult;
  retrieval: RetrievalOutcome;
  remedies: SafeRemedy[];
  blocked: ReturnType<typeof enforceRemedySafety>['blocked'];
  report: VisitReport;
};

/**
 * The golden path, in order. Pattern detection runs before retrieval because the
 * detected symptom decides which tag gets queried (docs/AGENT_RULES.md).
 */
export async function runPipeline(args: PipelineArgs): Promise<PipelineResult> {
  const { text, personaId, loadHistory, store, embedQuery, topK } = args;

  const extraction = extract(text);
  const symptom = extraction.primary?.tag ?? 'unknown';

  const history = await loadHistory(symptom);
  const values = severitySeries(history, symptom, extraction.severity);
  const pattern = detectPattern(values, symptom);

  const retrieval = await retrieveRemedies({
    query: text,
    tags: extraction.symptoms.map((item) => item.tag),
    store,
    embedQuery,
    topK,
    extraction,
  });

  const { safe, blocked } = enforceRemedySafety(retrieval.remedies);

  const report = buildVisitReport({
    personaId,
    pattern,
    remedies: safe,
    functionalImpact: extraction.functional_impact,
  });

  return { extraction, pattern, retrieval, remedies: safe, blocked, report };
}
