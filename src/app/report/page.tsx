'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadCheckin, type CheckinResponse } from '../checkin-state.js';

/* PLACEHOLDER COPY. Section headings and body text come from the pipeline so the
   printed report and the screen never drift apart. */

export default function ReportPage() {
  const [data, setData] = useState<CheckinResponse | null>(null);

  useEffect(() => setData(loadCheckin()), []);

  if (!data) {
    return (
      <p className="muted">
        Nothing to show yet. <Link href="/">Start a check-in</Link>.
      </p>
    );
  }

  const { report } = data;

  return (
    <>
      <h1>{report.title}</h1>
      <p className="muted">Generated {new Date(report.generatedAt).toLocaleString()}</p>

      {report.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>

          {section.kind === 'pattern' && <p>{section.body}</p>}

          {section.kind === 'remedies' &&
            section.items.map((remedy) => (
              <div className="card" key={remedy.id}>
                <strong>{remedy.name}</strong>
                <p>{remedy.explanation_text}</p>
                {remedy.caution && <p className="muted">Caution: {remedy.caution}</p>}
                <p className="muted">
                  {remedy.evidence_level} evidence · {remedy.source}
                </p>
              </div>
            ))}

          {(section.kind === 'impact' || section.kind === 'questions') && (
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <p className="muted">{report.disclaimer}</p>

      <p>
        <Link href="/results">Back to results</Link>
      </p>
    </>
  );
}
