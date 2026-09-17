import type {
  ExtractedSymptom,
  ExtractionResult,
  FunctionalImpact,
  SymptomTag,
} from './types.js';

/**
 * Free-text -> structured symptom data.
 *
 * Deterministic on purpose: an LLM pass here would be slower, non-reproducible,
 * and would make the eval harness measure the model instead of the retrieval.
 * `needsAssist` marks the cases a model could still help with; nothing calls one yet.
 */

const VOCAB: Record<SymptomTag, string[]> = {
  pelvic_pain: [
    'pelvic pain', 'pelvis', 'cramps', 'cramping', 'period pain', 'menstrual pain',
    'lower abdominal pain', 'abdominal pain', 'stomach pain', 'pain down there',
    'stabbing pain', 'uterus', 'uterine pain', 'pain in my ovaries', 'ovary pain',
  ],
  bloating: [
    'bloating', 'bloated', 'endo belly', 'swollen belly', 'swollen stomach',
    'distended', 'distension', 'distention', 'abdominal distension', 'puffy',
    'stomach blows up', 'look pregnant', 'tight stomach',
  ],
  fatigue: [
    'fatigue', 'fatigued', 'exhausted', 'exhaustion', 'no energy', 'zero energy',
    'wiped out', 'drained', 'so tired', 'dead tired', 'worn out', 'barely stay awake',
  ],
  heavy_bleeding: [
    'heavy bleeding', 'heavy period', 'heavy periods', 'flooding', 'soaking through',
    'bleeding through', 'clots', 'clotting', 'menorrhagia', 'gushing',
  ],
  painful_sex: [
    'painful sex', 'sex hurts', 'hurts during sex', 'pain during sex',
    'pain during intercourse', 'dyspareunia', 'painful intercourse',
  ],
  painful_bowel_movements: [
    'painful bowel movements', 'hurts to poop', 'pain when i poop', 'bowel pain',
    'painful bm', 'rectal pain', 'hurts to go to the bathroom', 'painful poops',
  ],
  nausea: [
    'nausea', 'nauseous', 'nauseated', 'queasy', 'throwing up', 'vomiting',
    'sick to my stomach', 'want to puke',
  ],
  back_pain: [
    'back pain', 'lower back', 'backache', 'back is killing', 'back aches', 'lumbar',
  ],
  leg_pain: [
    'leg pain', 'pain down my leg', 'sciatica', 'leg aches', 'legs ache', 'thigh pain',
  ],
};

const INTENSITY_WORDS: Array<[RegExp, number]> = [
  [/\b(?:unbearable|worst ever|can'?t take it|blinding|agony|excruciating)\b/i, 9],
  [/\b(?:horrible|awful|terrible|brutal|severe|debilitating|really bad)\b/i, 8],
  [/\b(?:bad|rough|intense|strong|hurts a lot)\b/i, 6],
  [/\b(?:moderate|medium|noticeable|uncomfortable)\b/i, 5],
  [/\b(?:manageable|okay-ish|not too bad)\b/i, 4],
  [/\b(?:mild|slight|a little|a bit|minor)\b/i, 3],
];

const IMPACT_PATTERNS: Array<[keyof FunctionalImpact, RegExp]> = [
  ['missed_work', /\b(?:couldn'?t (?:go to|make it (?:in )?to|face) work|missed work|called out (?:of|from|sick)|stayed home from work|had to leave work|couldn'?t work|no work today)\b/i],
  ['missed_school', /\b(?:missed (?:school|class|my lecture)|couldn'?t go to (?:school|class)|skipped class)\b/i],
  ['bedbound', /\b(?:couldn'?t get out of bed|stuck in bed|in bed all day|bed all day|curled up on the floor|lying on the floor)\b/i],
  ['cancelled_plans', /\b(?:cancel(?:l)?ed (?:my |our )?plans|had to cancel|bailed on|couldn'?t go out)\b/i],
  ['er_visit', /\b(?:went to the er|emergency room|urgent care|a&e|ambulance)\b/i],
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Damerau-Levenshtein: counts a transposition as one edit, not two. "cramsp" for
 * "cramps" is the single most common way people mistype these words, and plain
 * Levenshtein scores it the same as two unrelated substitutions.
 */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const rows: number[][] = [Array.from({ length: b.length + 1 }, (_, j) => j)];

  for (let i = 1; i <= a.length; i++) {
    rows[i] = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(
        rows[i][j - 1] + 1,
        rows[i - 1][j] + 1,
        rows[i - 1][j - 1] + cost,
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, rows[i - 2][j - 2] + 1);
      }

      rows[i][j] = value;
    }
  }

  return rows[a.length][b.length];
}

/**
 * Short words get a tighter budget: "back" -> "bad" must not count as a typo match.
 * The cap stays at 1 through 9 characters because "bloating" and "clotting" are two
 * edits apart and tag different symptoms — a 2-edit budget silently swaps them.
 */
function typoBudget(word: string): number {
  if (word.length <= 4) return 0;
  if (word.length <= 9) return 1;
  return 2;
}

function fuzzyContains(tokens: string[], phrase: string): boolean {
  const phraseWords = phrase.split(' ');
  if (phraseWords.length > 1) return false;

  const budget = typoBudget(phrase);
  if (budget === 0) return false;

  return tokens.some(
    (token) =>
      Math.abs(token.length - phrase.length) <= budget &&
      editDistance(token, phrase) <= budget,
  );
}

export function extractSeverity(text: string): number | null {
  const scaled = text.match(/\b(\d{1,2})\s*(?:\/|\s*out\s*of\s*)\s*10\b/i);
  if (scaled) {
    const value = Number(scaled[1]);
    if (value >= 1 && value <= 10) return value;
  }

  const bare = text.match(/\b(?:probably|maybe|like|about|around|a solid)?\s*an?\s+(\d{1,2})\b(?!\s*(?:am|pm|days?|hours?|weeks?|months?|years?|o'?clock))/i);
  if (bare) {
    const value = Number(bare[1]);
    if (value >= 1 && value <= 10) return value;
  }

  const levelWord = text.match(/\b(?:severity|pain|it'?s)\s+(?:is\s+)?(?:at\s+)?(?:a\s+)?(\d{1,2})\b/i);
  if (levelWord) {
    const value = Number(levelWord[1]);
    if (value >= 1 && value <= 10) return value;
  }

  for (const [pattern, value] of INTENSITY_WORDS) {
    if (pattern.test(text)) return value;
  }

  return null;
}

export function extractFunctionalImpact(text: string): FunctionalImpact {
  const impact: FunctionalImpact = {};
  for (const [key, pattern] of IMPACT_PATTERNS) {
    if (pattern.test(text)) impact[key] = true;
  }
  return impact;
}

export function extractSymptoms(text: string): ExtractedSymptom[] {
  const normalized = normalize(text);
  const tokens = normalized.split(' ');
  const found = new Map<SymptomTag, ExtractedSymptom & { position: number }>();

  for (const [tag, phrases] of Object.entries(VOCAB) as Array<[SymptomTag, string[]]>) {
    for (const phrase of phrases) {
      const position = normalized.indexOf(phrase);
      if (position !== -1) {
        const existing = found.get(tag);
        if (!existing || position < existing.position) {
          found.set(tag, {
            tag,
            severity: null,
            matchedPhrase: phrase,
            viaFuzzyMatch: false,
            position,
          });
        }
        break;
      }
    }

    if (found.has(tag)) continue;

    for (const phrase of phrases) {
      if (fuzzyContains(tokens, phrase)) {
        found.set(tag, {
          tag,
          severity: null,
          matchedPhrase: phrase,
          viaFuzzyMatch: true,
          position: Number.MAX_SAFE_INTEGER,
        });
        break;
      }
    }
  }

  return [...found.values()]
    .sort((a, b) => a.position - b.position)
    .map(({ position: _position, ...symptom }) => symptom);
}

export function extract(text: string): ExtractionResult {
  const symptoms = extractSymptoms(text);
  const severity = extractSeverity(text);

  // The first symptom named carries the severity: in practice people lead with
  // the thing that drove them to open the app.
  if (symptoms.length > 0) symptoms[0].severity = severity;

  return {
    symptoms,
    primary: symptoms[0] ?? null,
    severity,
    functional_impact: extractFunctionalImpact(text),
    rawText: text,
  };
}

/** True when a model-assisted pass would add something deterministic rules cannot. */
export function needsAssist(result: ExtractionResult): boolean {
  return result.symptoms.length === 0;
}
