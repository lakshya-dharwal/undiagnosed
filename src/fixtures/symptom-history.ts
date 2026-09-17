import type { SymptomHistoryRow } from '../lib/types.js';

export const DEMO_PERSONA_ID = 'persona_demo_01';

/**
 * PLACEHOLDER FIXTURES. Seeded history for the golden path (docs/DEMO.md):
 * pelvic pain at 5, then 6, then 7 across three cycles, then today's 8 with
 * work missed. Roughly cycle-spaced so the dates read as real check-ins.
 */
export const SYMPTOM_HISTORY_FIXTURES: SymptomHistoryRow[] = [
  {
    id: '22222222-2222-4222-8222-000000000001',
    persona_id: DEMO_PERSONA_ID,
    symptom: 'pelvic_pain',
    severity: 5,
    entry_date: '2026-06-14T09:00:00.000Z',
    functional_impact: {},
  },
  {
    id: '22222222-2222-4222-8222-000000000002',
    persona_id: DEMO_PERSONA_ID,
    symptom: 'pelvic_pain',
    severity: 6,
    entry_date: '2026-07-12T09:00:00.000Z',
    functional_impact: { cancelled_plans: true },
  },
  {
    id: '22222222-2222-4222-8222-000000000003',
    persona_id: DEMO_PERSONA_ID,
    symptom: 'pelvic_pain',
    severity: 7,
    entry_date: '2026-08-15T09:00:00.000Z',
    functional_impact: { cancelled_plans: true },
  },
  {
    id: '22222222-2222-4222-8222-000000000004',
    persona_id: DEMO_PERSONA_ID,
    symptom: 'pelvic_pain',
    severity: 8,
    entry_date: '2026-09-17T09:00:00.000Z',
    functional_impact: { missed_work: true },
  },
];

/** The three prior check-ins only — today's entry comes from the user's input. */
export const SEEDED_HISTORY = SYMPTOM_HISTORY_FIXTURES.slice(0, 3);
