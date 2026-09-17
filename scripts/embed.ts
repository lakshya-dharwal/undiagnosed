import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { embedBatch } from '../src/lib/embeddings.js';
import { createSupabaseClient } from '../src/lib/store.js';
import { REMEDY_FIXTURES } from '../src/fixtures/remedies.js';
import type { EvidenceLevel, RemedyEntry } from '../src/lib/types.js';

/**
 * Loads remedy rows and fills in their embeddings.
 *
 *   npm run embed -- --file data/remedies.csv   load a spreadsheet, then embed
 *   npm run embed -- --fixtures                 load the placeholder fixtures
 *   npm run embed                               embed rows already in the DB
 *
 * Embedding is driven off explanation_text and only runs for rows missing a
 * vector, so re-running after adding five rows costs five embeddings, not all of them.
 */

type RawRow = Omit<RemedyEntry, 'id' | 'embedding'> & { id?: string };

/** RFC4180-ish: handles quoted fields, embedded commas and doubled quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((cell) => cell.trim() !== ''));
}

function parseTags(value: string): string[] {
  return value
    .split(/[|;,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function loadFile(path: string): RawRow[] {
  const contents = readFileSync(path, 'utf8');

  if (extname(path) === '.json') {
    const parsed = JSON.parse(contents) as RawRow[];
    return parsed.map((row) => ({
      ...row,
      symptom_tags: Array.isArray(row.symptom_tags) ? row.symptom_tags : parseTags(String(row.symptom_tags)),
    }));
  }

  const [header, ...dataRows] = parseCsv(contents);
  const columns = header.map((name) => name.trim().toLowerCase());

  return dataRows.map((cells) => {
    const record = Object.fromEntries(columns.map((name, i) => [name, (cells[i] ?? '').trim()]));
    const caution = record.caution ?? '';

    return {
      id: record.id || undefined,
      name: record.name,
      symptom_tags: parseTags(record.symptom_tags ?? ''),
      explanation_text: record.explanation_text,
      source: record.source,
      evidence_level: record.evidence_level as EvidenceLevel,
      caution: caution === '' ? null : caution,
    };
  });
}

function validate(rows: RawRow[]): void {
  const problems: string[] = [];

  rows.forEach((row, i) => {
    const label = `row ${i + 1} (${row.name || 'unnamed'})`;
    if (!row.name?.trim()) problems.push(`${label}: missing name`);
    if (!row.explanation_text?.trim()) problems.push(`${label}: missing explanation_text`);
    if (!row.source?.trim()) problems.push(`${label}: missing source`);
    if (!['strong', 'moderate', 'early'].includes(row.evidence_level)) {
      problems.push(`${label}: evidence_level must be strong|moderate|early, got "${row.evidence_level}"`);
    }
    if (!row.symptom_tags?.length) problems.push(`${label}: no symptom_tags`);
  });

  if (problems.length > 0) {
    // Refusing the whole load keeps a half-embedded, half-unsourced table from existing.
    throw new Error(`Refusing to load. Fix these first:\n  ${problems.join('\n  ')}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf('--file');
  const client = createSupabaseClient();

  let incoming: RawRow[] | null = null;
  if (fileIndex !== -1) incoming = loadFile(args[fileIndex + 1]);
  else if (args.includes('--fixtures')) incoming = REMEDY_FIXTURES;

  if (incoming) {
    validate(incoming);
    const { error } = await client.from('remedy_entries').upsert(
      incoming.map((row) => ({ ...row, embedding: null })),
      { onConflict: 'id' },
    );
    if (error) throw new Error(`Upsert failed: ${error.message}`);
    console.log(`Loaded ${incoming.length} rows.`);
  }

  const { data: pending, error } = await client
    .from('remedy_entries')
    .select('id, explanation_text')
    .is('embedding', null);

  if (error) throw new Error(`Fetch failed: ${error.message}`);
  if (!pending || pending.length === 0) {
    console.log('Nothing to embed; every row already has a vector.');
    return;
  }

  console.log(`Embedding ${pending.length} rows with text-embedding-3-small...`);
  const vectors = await embedBatch(pending.map((row) => row.explanation_text));

  for (const [i, row] of pending.entries()) {
    const { error: updateError } = await client
      .from('remedy_entries')
      .update({ embedding: vectors[i] as unknown as string })
      .eq('id', row.id);

    if (updateError) throw new Error(`Update failed for ${row.id}: ${updateError.message}`);
  }

  console.log(`Wrote ${vectors.length} embeddings.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
