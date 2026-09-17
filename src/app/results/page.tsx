'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { loadCheckin, type CheckinResponse } from '../checkin-state.js';

/* PLACEHOLDER COPY throughout. Pattern and remedy text is rendered verbatim
   from the pipeline — never re-worded here (docs/AGENT_RULES.md). */

function Results() {
  const [data, setData] = useState<CheckinResponse | null>(null);
  const debug = useSearchParams().get('debug') === '1';

  useEffect(() => setData(loadCheckin()), []);

  if (!data) {
    return (
      <p className="muted">
        Nothing to show yet. <Link href="/">Start a check-in</Link>.
      </p>
    );
  }

  const { pattern, remedies, message, trace, extraction } = data;

  return (
    <>
      <h1>here&apos;s what your body might be dealing with</h1>

      <div className="card">
        <p>
          {pattern.symptom.replace(/_/g, ' ')}: {pattern.values.join(' → ')} out of 10
        </p>
        <p className="muted">
          pattern: {pattern.pattern} · slope {pattern.slope} per check-in
        </p>
      </div>

      <h2>{message}</h2>

      {remedies.length === 0 && <p className="muted">Nothing tagged for this yet.</p>}

      {remedies.map((remedy) => (
        <div className="card" key={remedy.id}>
          <strong>{remedy.name}</strong>
          <p>{remedy.explanation_text}</p>
          {remedy.caution && <p className="muted">Caution: {remedy.caution}</p>}
          <p className="muted">
            {remedy.evidence_level} evidence · {remedy.source}
          </p>
          <p className="muted">{remedy.disclaimer}</p>
        </div>
      ))}

      <p>
        <Link href="/report">See the full Visit Report</Link>
      </p>

      {debug && (
        <>
          <h2>retrieval trace</h2>
          <p className="muted">
            {trace.survivedTagFilter} of {trace.corpusSize} rows survived the tag filter ·
            severity {extraction.severity ?? 'not stated'}
          </p>
          <pre>{JSON.stringify(trace, null, 2)}</pre>
        </>
      )}
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense>
      <Results />
    </Suspense>
  );
}
