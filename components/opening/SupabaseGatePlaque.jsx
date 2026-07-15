'use client';

import { useState } from 'react';

function authMessage(result, fallback) {
  if (result?.message) return result.message;
  if (result?.error === 'owner_authorization_only') return 'Owner authorization only.';
  if (result?.configured === false || result?.error === 'supabase_auth_not_configured') return 'SUPABASE AUTH IS NOT CONFIGURED.';
  return [result?.error, result?.error_code, result?.error_description].filter(Boolean).join(' | ') || fallback;
}

export default function SupabaseGatePlaque({ onAuthorized }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sendCode = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus('');

    const response = await fetch('/api/chaotica-auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const result = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      setStatus(authMessage(result, 'EMAIL CODE COULD NOT BE SENT.'));
      return;
    }

    setCodeSent(true);
    setStatus('CODE SENT.');
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus('');

    const response = await fetch('/api/chaotica-auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    });
    const result = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok || !result?.authorized) {
      setStatus(authMessage(result, 'CODE COULD NOT BE VERIFIED.'));
      return;
    }

    onAuthorized?.();
  };

  return (
    <section className="chaotica-auth-plaque" aria-label="Gate authorization plaque">
      {!codeSent ? (
        <form onSubmit={sendCode}>
          <h2>AUTHORIZE THE GATE</h2>
          <p>Enter the owner email to receive a code.</p>
          <label htmlFor="chaotica-owner-email">Owner email</label>
          <input
            id="chaotica-owner-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <button type="submit" disabled={submitting}>{submitting ? 'SENDING CODE…' : 'SEND CODE'}</button>
        </form>
      ) : (
        <form onSubmit={verifyCode}>
          <h2>SPEAK TRUE TO ENTER</h2>
          <p>Enter the 6-digit code sent to your email.</p>
          <label htmlFor="chaotica-owner-code">6-digit code</label>
          <input
            id="chaotica-owner-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={token}
            onChange={(event) => setToken(event.target.value.replace(/\D/g, '').slice(0, 6))}
            autoComplete="one-time-code"
            required
          />
          <button type="submit" disabled={submitting || token.length !== 6}>{submitting ? 'VERIFYING CODE…' : 'VERIFY CODE'}</button>
        </form>
      )}
      {status ? <span role="alert">{status}</span> : null}
    </section>
  );
}
