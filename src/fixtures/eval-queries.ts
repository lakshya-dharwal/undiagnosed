import type { FunctionalImpact, SymptomTag } from '../lib/types.js';

export type QueryStyle = 'casual' | 'clinical' | 'vague' | 'multi_symptom' | 'typo';

export type EvalQuery = {
  id: string;
  query: string;
  style: QueryStyle;
  /** Ground truth, primary first. Empty means we expect a graceful empty state. */
  expectedTags: SymptomTag[];
  expectedSeverity?: number | null;
  expectedImpact?: Array<keyof FunctionalImpact>;
  /** Remedy names that must appear in the top 5 for the ranking to count as correct. */
  mustIncludeNames?: string[];
};

/**
 * Held-out test set for the retrieval eval. Written to cover how people actually
 * type when they are in pain: lowercase, mid-sentence, abbreviated, misspelled.
 * Ground-truth tags are deliberately independent of what the extractor produces —
 * if extraction picks the wrong tag, precision should fall, and that is the point.
 */
export const EVAL_QUERIES: EvalQuery[] = [
  {
    id: 'Q01',
    query: "my cramps are horrible again today, probably an 8 out of 10, and I couldn't go to work",
    style: 'casual',
    expectedTags: ['pelvic_pain'],
    expectedSeverity: 8,
    expectedImpact: ['missed_work'],
  },
  {
    id: 'Q02',
    query: 'period pain is killing me rn, like a 9',
    style: 'casual',
    expectedTags: ['pelvic_pain'],
    expectedSeverity: 9,
  },
  {
    id: 'Q03',
    query: 'my stomach blows up every afternoon and I look pregnant by dinner',
    style: 'casual',
    expectedTags: ['bloating'],
    expectedSeverity: null,
    mustIncludeNames: ['Low-FODMAP trial', 'Peppermint oil capsules'],
  },
  {
    id: 'Q04',
    query: 'so tired I can barely stay awake at my desk, this is a 7',
    style: 'casual',
    expectedTags: ['fatigue'],
    expectedSeverity: 7,
  },
  {
    id: 'Q05',
    query: 'bleeding through a super tampon every hour, soaking through everything',
    style: 'casual',
    expectedTags: ['heavy_bleeding'],
    mustIncludeNames: ['Tranexamic acid'],
  },
  {
    id: 'Q06',
    query: 'chronic pelvic pain with dysmenorrhea, severity 7 out of 10',
    style: 'clinical',
    expectedTags: ['pelvic_pain'],
    expectedSeverity: 7,
  },
  {
    id: 'Q07',
    query: 'dyspareunia on deep penetration, worsening over three cycles',
    style: 'clinical',
    expectedTags: ['painful_sex'],
    mustIncludeNames: ['Pelvic floor physical therapy'],
  },
  {
    id: 'Q08',
    query: 'menorrhagia with clotting, moderate severity',
    style: 'clinical',
    expectedTags: ['heavy_bleeding'],
    expectedSeverity: 5,
  },
  {
    id: 'Q09',
    query: 'cyclical abdominal distension with altered bowel habit',
    style: 'clinical',
    expectedTags: ['bloating'],
  },
  {
    id: 'Q10',
    query: 'persistent fatigue despite adequate sleep, unresponsive to rest',
    style: 'clinical',
    expectedTags: ['fatigue'],
  },
  {
    id: 'Q11',
    query: 'something is not right, I get this pain down there most days now',
    style: 'vague',
    expectedTags: ['pelvic_pain'],
  },
  {
    id: 'Q12',
    query: 'I feel drained all the time and no one can tell me why',
    style: 'vague',
    expectedTags: ['fatigue'],
  },
  {
    id: 'Q13',
    query: 'I just feel off lately and I wanted to write it down',
    style: 'vague',
    expectedTags: [],
  },
  {
    id: 'Q14',
    query: 'honestly everything has felt wrong since the spring',
    style: 'vague',
    expectedTags: [],
  },
  {
    id: 'Q15',
    query: 'cramps and bloating both terrible today, had to cancel plans',
    style: 'multi_symptom',
    expectedTags: ['pelvic_pain', 'bloating'],
    expectedSeverity: 8,
    expectedImpact: ['cancelled_plans'],
  },
  {
    id: 'Q16',
    query: 'heavy bleeding, exhausted, and my back is killing me',
    style: 'multi_symptom',
    expectedTags: ['heavy_bleeding', 'fatigue', 'back_pain'],
  },
  {
    id: 'Q17',
    query: "pain during sex and cramps that won't quit afterwards",
    style: 'multi_symptom',
    expectedTags: ['painful_sex', 'pelvic_pain'],
  },
  {
    id: 'Q18',
    query: 'bloated, nauseous and cramping since Monday',
    style: 'multi_symptom',
    expectedTags: ['bloating', 'nausea', 'pelvic_pain'],
  },
  {
    id: 'Q19',
    query: 'my cramsp are so bad today I stayed home from work',
    style: 'typo',
    expectedTags: ['pelvic_pain'],
    expectedImpact: ['missed_work'],
  },
  {
    id: 'Q20',
    query: 'bloted and gassy all week before my period',
    style: 'typo',
    expectedTags: ['bloating'],
  },
  {
    id: 'Q21',
    query: 'exhusted no matter how much I sleep',
    style: 'typo',
    expectedTags: ['fatigue'],
  },
  {
    id: 'Q22',
    query: 'naseous every morning during my period',
    style: 'typo',
    expectedTags: ['nausea'],
  },
  {
    id: 'Q23',
    query: "hurts to poop when I'm on my period, it's a 6",
    style: 'casual',
    expectedTags: ['painful_bowel_movements'],
    expectedSeverity: 6,
  },
  {
    id: 'Q24',
    query: "cramping at a 9, worst it's ever been, ended up in bed all day",
    style: 'casual',
    expectedTags: ['pelvic_pain'],
    expectedSeverity: 9,
    expectedImpact: ['bedbound'],
  },
];
