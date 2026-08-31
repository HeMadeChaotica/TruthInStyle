'use client';

import { useState } from 'react';

export default function ChaoticaPasswordPlaque({ onAuthorized }) {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const unlock = async (event) => {
    event.preventDefault();
    if (submitting || !password) return;
    setSubmitting(true);
    setStatus('');
    try {
      const response = await fetch('/api/chaotica-auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.authorized) {
        setStatus(result?.message || 'THE SEAL COULD NOT VERIFY THAT PASSWORD.');
        return;
      }
      setPassword('');
      onAuthorized?.();
    } catch {
      setStatus('THE SEAL COULD NOT REACH CHAOTICA. CHECK YOUR CONNECTION, THEN TRY AGAIN.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="chaotica-auth-plaque" aria-label="CHAOTICA password gate">
      <form onSubmit={unlock}>
        <label className="chaotica-visually-hidden" htmlFor="chaotica-password">CHAOTICA PASSWORD</label>
        <input
          id="chaotica-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
          placeholder="PASSWORD"
          required
        />
        <button className="chaotica-auth-seal" type="submit" disabled={submitting || !password} aria-label={submitting ? 'VERIFYING PASSWORD' : 'UNLOCK CHAOTICA'}>
          <span aria-hidden="true">◆</span>
        </button>
      </form>
      {status ? <span role="alert">{status}</span> : null}
    </section>
  );
}
