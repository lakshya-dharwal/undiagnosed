export type EvidenceLevel = 'strong' | 'moderate' | 'early';

export type SymptomTag =
  | 'pelvic_pain'
  | 'bloating'
  | 'fatigue'
  | 'heavy_bleeding'
  | 'painful_sex'
  | 'painful_bowel_movements'
  | 'nausea'
  | 'back_pain'
  | 'leg_pain';

export const SYMPTOM_TAGS: SymptomTag[] = [
  'pelvic_pain',
  'bloating',
  'fatigue',
  'heavy_bleeding',
  'painful_sex',
  'painful_bowel_movements',
  'nausea',
  'back_pain',
  'leg_pain',
];

export type RemedyEntry = {
  id: string;
  name: string;
  symptom_tags: string[];
  explanation_text: string;
  source: string;
  evidence_level: EvidenceLevel;
  caution: string | null;
  embedding?: number[] | null;
};

export type ScoredRemedy = RemedyEntry & {
  similarity: number;
};

export type SafeRemedy = ScoredRemedy & {
  disclaimer: string;
};

export type SymptomHistoryRow = {
  id: string;
  persona_id: string;
  symptom: string;
  severity: number;
  entry_date: string;
  functional_impact: Record<string, unknown>;
};

export type FunctionalImpact = {
  missed_work?: boolean;
  missed_school?: boolean;
  bedbound?: boolean;
  cancelled_plans?: boolean;
  er_visit?: boolean;
};

export type ExtractedSymptom = {
  tag: SymptomTag;
  severity: number | null;
  matchedPhrase: string;
  viaFuzzyMatch: boolean;
};

export type ExtractionResult = {
  symptoms: ExtractedSymptom[];
  primary: ExtractedSymptom | null;
  severity: number | null;
  functional_impact: FunctionalImpact;
  rawText: string;
};

export type PatternKind =
  | 'increasing_severity'
  | 'decreasing_severity'
  | 'stable'
  | 'insufficient_data';

export type PatternResult = {
  pattern: PatternKind;
  symptom: string;
  values: number[];
  detected: boolean;
  slope: number;
  netChange: number;
  dips: number;
};
