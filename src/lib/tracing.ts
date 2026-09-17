import type { RetrievalTrace } from './retrieval.js';
import type { ExtractionResult } from './types.js';

/** Human-readable dump of every decision retrieval made, for CLI and debug views. */
export function formatTrace(trace: RetrievalTrace, extraction?: ExtractionResult): string {
  const lines: string[] = [];

  lines.push(`QUERY: ${trace.query}`);
  lines.push(`STATUS: ${trace.status}`);
  lines.push('');

  lines.push('1. SYMPTOM EXTRACTION');
  if (trace.extractedTags.length === 0) {
    lines.push('   no tags matched the symptom vocabulary');
  } else {
    for (const tag of trace.extractedTags) {
      const how = tag.viaFuzzyMatch ? 'fuzzy' : 'exact';
      lines.push(
        `   ${tag.tag.padEnd(26)} weight ${tag.weight.toFixed(2)}  via ${how} match on "${tag.matchedPhrase}"`,
      );
    }
  }
  if (extraction) {
    lines.push(`   severity: ${extraction.severity ?? 'not stated'}`);
    const impact = Object.keys(extraction.functional_impact);
    lines.push(`   functional impact: ${impact.length ? impact.join(', ') : 'none detected'}`);
  }
  lines.push('');

  lines.push('2. TAG FILTER');
  lines.push(`   ${trace.survivedTagFilter} of ${trace.corpusSize} rows survived`);
  lines.push('');

  lines.push('3. CANDIDATE SCORES (all, ranked)');
  if (trace.candidates.length === 0) {
    lines.push('   none');
  } else {
    lines.push(
      `   ${'remedy'.padEnd(34)} ${'sim'.padEnd(8)} ${'wt'.padEnd(6)} ${'score'.padEnd(8)} evidence`,
    );
    for (const candidate of trace.candidates) {
      lines.push(
        `   ${candidate.name.slice(0, 33).padEnd(34)} ${candidate.baseSimilarity.toFixed(4).padEnd(8)} ${candidate.tagWeight.toFixed(2).padEnd(6)} ${candidate.score.toFixed(4).padEnd(8)} ${candidate.evidence_level}`,
      );
    }
  }
  lines.push('');

  lines.push('4. TIEBREAKS');
  if (trace.tiebreaks.length === 0) {
    lines.push('   none');
  } else {
    for (const tie of trace.tiebreaks) {
      lines.push(
        `   ~${tie.bucketScore.toFixed(2)}: ${tie.between.join(' | ')} -> ${tie.winner} (by ${tie.resolvedBy})`,
      );
    }
  }
  lines.push('');

  lines.push('5. FINAL RANKING');
  if (trace.finalRanking.length === 0) {
    lines.push('   nothing returned');
  } else {
    for (const entry of trace.finalRanking) {
      lines.push(`   ${entry.rank}. ${entry.name}`);
      lines.push(`      ${entry.reason}`);
    }
  }

  return lines.join('\n');
}
