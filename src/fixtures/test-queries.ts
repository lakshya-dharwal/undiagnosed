/**
 * Query strings used by tests/retrieval-edge-cases.test.ts that sit outside the
 * held-out eval set in eval-queries.ts. `npm run embed:fixtures` embeds these
 * alongside EVAL_QUERIES so the whole test suite runs offline (deterministic,
 * no OPENAI_API_KEY required at test time).
 *
 * Keep in sync with tests/retrieval-edge-cases.test.ts — the tests import these
 * constants rather than duplicating the strings.
 */
export const EDGE_TEST_QUERIES = {
  /** 'edge case: symptom has no tagged remedies' — no corpus entry has this tag. */
  tinnitus: 'my ears have been ringing constantly',
  /** 'edge case: tag filter returns fewer than topK' — only some remedies are tagged. */
  painfulSex: 'painful sex',
  /** 'edge case: tag filter returns fewer than topK' — the filter fills every slot. */
  pelvicPain: 'pelvic pain',
  /** 'edge case: near-identical similarity scores' — tiebreak is embedding-independent. */
  cramps: 'cramps',
  /** 'trace completeness' — a phrasing outside the eval set that still extracts pelvic_pain. */
  periodPainShort: 'period pain is killing me',
} as const;
