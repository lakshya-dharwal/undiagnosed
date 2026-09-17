'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { saveCheckin, type CheckinResponse } from './checkin-state.js';

/* PLACEHOLDER COPY throughout — the content lead owns the final wording. */

export default function CheckinPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error(await response.text());

      saveCheckin((await response.json()) as CheckinResponse);
      router.push('/results');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <h1>let&apos;s figure out what your body is saying</h1>
      <p className="muted">
        In your own words — what is going on today, and how bad is it?
      </p>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="my cramps are horrible again today, probably an 8 out of 10, and I couldn't go to work"
      />

      <button onClick={submit} disabled={pending || text.trim().length === 0}>
        {pending ? 'reading...' : 'continue'}
      </button>

      {error && <p className="muted">{error}</p>}
    </>
  );
}
