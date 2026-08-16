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
    const response = await fetch('/api/chaotica-auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const result = await response.json().catch(() => ({}));
    setSubmitting(false);
    setPassword('');
    if (!response.ok || !result?.authorized) {
      setStatus(result?.message || 'THE SEAL COULD NOT VERIFY THAT PASSWORD.');
      return;
    }
    onAuthorized?.();
  };

  return (
    <section className="chaotica-auth-plaque" aria-label="CHAOTICA password gate">
      <form onSubmit={unlock}>
        <h2>UNLOCK THE SEAL</h2>
        <p>Enter your CHAOTICA password. Then the seal will listen for your oath.</p>
        <label htmlFor="chaotica-password">CHAOTICA password</label>
        <input
          id="chaotica-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
          required
        />
        <button type="submit" disabled={submitting || !password}>{submitting ? 'VERIFYING…' : 'UNLOCK THE SEAL'}</button>
      </form>
      {status ? <span role="alert">{status}</span> : null}
    </section>
  );
}
