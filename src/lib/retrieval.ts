import { extract } from './extraction.js';
import type { RemedyStore } from './store.js';
import type { EvidenceLevel, ExtractionResult, ScoredRemedy } from './types.js';

export const DEFAULT_TOP_K = 5;

/**
 * When someone names several symptoms the first one still drives the page, but the
 * others should not be silently dropped. Weighting rather than hard-filtering lets a
 * strongly-matching secondary remedy outrank a weak primary one without ever letting
 * an untagged remedy in.
 */
export const PRIMARY_TAG_WEIGHT = 1.0;
export const SECONDARY_TAG_WEIGHT = 0.85;

/** Score gap below which two remedies count as tied and evidence level decides. */
export const TIE_EPSILON = 0.01;

const EVIDENCE_RANK: Record<EvidenceLevel, number> = { strong: 0, moderate: 1, early: 2 };

export type RetrievalStatus =
  | 'ok'
  | 'fewer_than_requested'
  | 'no_remedies_for_tag'
  | 'no_tag_match';

export type CandidateTrace = {
  id: string;
  name: string;
  symptom_tags: string[];
  evidence_level: EvidenceLevel;
  baseSimilarity: number;
  matchedTag: string;
  tagWeight: number;
  score: number;
};

export type TiebreakTrace = {
  bucketScore: number;
  between: string[];
  resolvedBy: 'evidence_level' | 'name';
  winner: string;
};

export type RetrievalTrace = {
  query: string;
  extractedTags: Array<{
    tag: string;
    weight: number;
    matchedPhrase: string;
    viaFuzzyMatch: boolean;
  }>;
  corpusSize: number;
  survivedTagFilter: number;
  candidates: CandidateTrace[];
  tiebreaks: TiebreakTrace[];
  finalRanking: Array<{ rank: number; id: string; name: string; score: number; reason: string }>;
  status: RetrievalStatus;
};

export type RetrievalOutcome = {
  remedies: ScoredRemedy[];
  status: RetrievalStatus;
  /** PLACEHOLDER COPY — content lead owns final wording. */
  message: string;
  trace: RetrievalTrace;
};

/** PLACEHOLDER COPY — replace with the content lead's wording. */
const STATUS_MESSAGES: Record<RetrievalStatus, string> = {
  ok: 'here is your next step',
  fewer_than_requested: 'here is what we have for this one so far',
  no_remedies_for_tag: "we don't have anything tagged for this yet — it's still worth writing down",
  no_tag_match: "tell us a bit more about what your body is doing and we'll find something",
};

function round(value: number, places = 4): number {
  return Number(value.toFixed(places));
}

function bucket(score: number): number {
  return Math.round(score / TIE_EPSILON) * TIE_EPSILON;
}

export type RetrieveArgs = {
  query: string;
  /** Ordered, primary first. */
  tags: string[];
  store: RemedyStore;
  embedQuery: (text: string) => Promise<number[]>;
  topK?: number;
  extraction?: ExtractionResult;
};

export async function retrieveRemedies(args: RetrieveArgs): Promise<RetrievalOutcome> {
  const { query, tags, store, embedQuery, topK = DEFAULT_TOP_K, extraction } = args;

  const weightOf = (tag: string) =>
    tags.indexOf(tag) === 0 ? PRIMARY_TAG_WEIGHT : SECONDARY_TAG_WEIGHT;

  const extractedTags = tags.map((tag) => {
    const match = extraction?.symptoms.find((symptom) => symptom.tag === tag);
    return {
      tag,
      weight: weightOf(tag),
      matchedPhrase: match?.matchedPhrase ?? tag,
      viaFuzzyMatch: match?.viaFuzzyMatch ?? false,
    };
  });

  const emptyTrace = (status: RetrievalStatus, corpusSize: number): RetrievalTrace => ({
    query,
    extractedTags,
    corpusSize,
    survivedTagFilter: 0,
    candidates: [],
    tiebreaks: [],
    finalRanking: [],
    status,
  });

  // No recognised symptom vocabulary. We do NOT fall back to unfiltered vector
  // search: on a 10-15 row corpus that returns the nearest thing to nonsense with
  // full confidence, which is worse than asking one more question.
  if (tags.length === 0) {
    const corpusSize = await store.corpusSize();
    return {
      remedies: [],
      status: 'no_tag_match',
      message: STATUS_MESSAGES.no_tag_match,
      trace: emptyTrace('no_tag_match', corpusSize),
    };
  }

  const corpusSize = await store.corpusSize();
  const queryEmbedding = await embedQuery(query);
  const candidateRows = await store.candidatesByTags(tags, queryEmbedding);

  if (candidateRows.length === 0) {
    return {
      remedies: [],
      status: 'no_remedies_for_tag',
      message: STATUS_MESSAGES.no_remedies_for_tag,
      trace: emptyTrace('no_remedies_for_tag', corpusSize),
    };
  }

  const candidates: CandidateTrace[] = candidateRows.map((row) => {
    const matchedTag =
      row.symptom_tags
        .filter((tag) => tags.includes(tag))
        .sort((a, b) => weightOf(b) - weightOf(a))[0] ?? tags[0];
    const tagWeight = weightOf(matchedTag);

    return {
      id: row.id,
      name: row.name,
      symptom_tags: row.symptom_tags,
      evidence_level: row.evidence_level,
      baseSimilarity: round(row.similarity),
      matchedTag,
      tagWeight,
      score: round(row.similarity * tagWeight),
    };
  });

  const byScore = new Map<string, ScoredRemedy>(
    candidateRows.map((row) => [row.id, row]),
  );

  candidates.sort((a, b) => {
    const bucketDiff = bucket(b.score) - bucket(a.score);
    if (Math.abs(bucketDiff) > Number.EPSILON) return bucketDiff;

    const evidenceDiff = EVIDENCE_RANK[a.evidence_level] - EVIDENCE_RANK[b.evidence_level];
    if (evidenceDiff !== 0) return evidenceDiff;

    return a.name.localeCompare(b.name);
  });

  const tiebreaks: TiebreakTrace[] = [];
  const buckets = new Map<number, CandidateTrace[]>();
  for (const candidate of candidates) {
    const key = round(bucket(candidate.score), 3);
    buckets.set(key, [...(buckets.get(key) ?? []), candidate]);
  }
  for (const [bucketScore, members] of buckets) {
    if (members.length < 2) continue;
    const distinctEvidence = new Set(members.map((m) => m.evidence_level)).size > 1;
    tiebreaks.push({
      bucketScore,
      between: members.map((m) => m.name),
      resolvedBy: distinctEvidence ? 'evidence_level' : 'name',
      winner: members[0].name,
    });
  }

  const top = candidates.slice(0, topK);

  // Returning fewer than topK is correct: loosening the tag filter to pad the list
  // would show remedies not tagged for her symptom, which is a relevance regression
  // dressed up as completeness.
  const status: RetrievalStatus =
    top.length < topK ? 'fewer_than_requested' : 'ok';

  const finalRanking = top.map((candidate, index) => {
    const tie = tiebreaks.find((t) => t.between.includes(candidate.name));
    const base = `similarity ${candidate.baseSimilarity.toFixed(4)} x tag weight ${candidate.tagWeight.toFixed(2)} (${candidate.matchedTag}) = ${candidate.score.toFixed(4)}`;
    const tieNote = tie
      ? `; tied at ~${tie.bucketScore.toFixed(2)} with ${tie.between.filter((n) => n !== candidate.name).join(', ')}, resolved by ${tie.resolvedBy}`
      : '';

    return {
      rank: index + 1,
      id: candidate.id,
      name: candidate.name,
      score: candidate.score,
      reason: base + tieNote,
    };
  });

  return {
    remedies: top.map((candidate) => {
      const row = byScore.get(candidate.id) as ScoredRemedy;
      return { ...row, similarity: candidate.score };
    }),
    status,
    message: STATUS_MESSAGES[status],
    trace: {
      query,
      extractedTags,
      corpusSize,
      survivedTagFilter: candidateRows.length,
      candidates,
      tiebreaks,
      finalRanking,
      status,
    },
  };
}

/** Convenience wrapper: raw text in, retrieval out, extraction handled internally. */
export async function retrieveFromText(
  query: string,
  store: RemedyStore,
  embedQuery: (text: string) => Promise<number[]>,
  topK = DEFAULT_TOP_K,
): Promise<RetrievalOutcome & { extraction: ExtractionResult }> {
  const extraction = extract(query);
  const outcome = await retrieveRemedies({
    query,
    tags: extraction.symptoms.map((symptom) => symptom.tag),
    store,
    embedQuery,
    topK,
    extraction,
  });

  return { ...outcome, extraction };
}
