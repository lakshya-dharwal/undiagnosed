import { NextResponse } from 'next/server';
import { DEMO_PERSONA_ID } from '../../../fixtures/symptom-history.js';
import { embedText } from '../../../lib/embeddings.js';
import { runPipeline } from '../../../lib/pipeline.js';
import {
  SupabaseRemedyStore,
  createSupabaseClient,
  fetchSymptomHistory,
} from '../../../lib/store.js';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: string; personaId?: string };
  const text = body.text?.trim();

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const personaId = body.personaId ?? DEMO_PERSONA_ID;
  const client = createSupabaseClient();

  const result = await runPipeline({
    text,
    personaId,
    loadHistory: (symptom) => fetchSymptomHistory(client, personaId, symptom),
    store: new SupabaseRemedyStore(client),
    embedQuery: embedText,
  });

  return NextResponse.json({
    extraction: result.extraction,
    pattern: result.pattern,
    status: result.retrieval.status,
    message: result.retrieval.message,
    remedies: result.remedies,
    report: result.report,
    trace: result.retrieval.trace,
  });
}
