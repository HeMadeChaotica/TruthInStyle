'use client';

import { useEffect, useState } from 'react';

export default function SupabaseGatePlaque({ onAuthorized }) {
  const [credential, setCredential] = useState('');
  const [status, setStatus] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting || cooldown > 0) return;
    setSubmitting(true);
    setStatus('');

    try {
      const response = await fetch('/api/chaotica-auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: credential }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.authorized) {
        setStatus('THE GATE DID NOT RECOGNIZE THAT.');
        setCooldown(8);
        return;
      }
      setCredential('');
      onAuthorized?.();
    } catch {
      setStatus('THE GATE DID NOT RECOGNIZE THAT.');
      setCooldown(8);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="chaotica-auth-plaque" onSubmit={submit} aria-label="Gate authorization plaque">
      <h2>AUTHORIZE THE GATE</h2>
      <p>Supabase authorization required.</p>
      <label>
        Supabase credential
        <input
          type="password"
          value={credential}
          onChange={(event) => setCredential(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <button type="submit" disabled={submitting || cooldown > 0}>
        {cooldown > 0 ? `THE GATE IS COOLING. TRY AGAIN IN ${cooldown}s.` : 'OPEN CHAOTICA'}
      </button>
      {status ? <span role="alert">{status}</span> : null}
    </form>
  );
}
