'use client';

import type { RetrievalTrace } from '../lib/retrieval.js';
import type { ExtractionResult, PatternResult, SafeRemedy } from '../lib/types.js';
import type { VisitReport } from '../lib/visit-report.js';

export type CheckinResponse = {
  extraction: ExtractionResult;
  pattern: PatternResult;
  status: string;
  message: string;
  remedies: SafeRemedy[];
  report: VisitReport;
  trace: RetrievalTrace;
};

const KEY = 'undiagnosed:last-checkin';

/**
 * Scaffold-level state handoff between pages. Replace with a real session or a
 * conversation_log row once check-ins need to persist beyond one tab.
 */
export function saveCheckin(result: CheckinResponse): void {
  sessionStorage.setItem(KEY, JSON.stringify(result));
}

export function loadCheckin(): CheckinResponse | null {
  const raw = sessionStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as CheckinResponse) : null;
}
