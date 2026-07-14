'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sanitizeAuthNext } from '../../../src/shared/authNext';

function collectAuthFailure(searchParams, hashParams, fallback = 'unknown_auth_failure') {
  const details = [
    ['error', searchParams.get('error') || hashParams.get('error')],
    ['error_code', searchParams.get('error_code') || hashParams.get('error_code')],
    ['error_description', searchParams.get('error_description') || hashParams.get('error_description')],
  ].filter(([, value]) => value);

  if (!details.length) return fallback;
  return details.map(([key, value]) => `${key}: ${value}`).join(' | ');
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('AUTHORIZING THE GATE…');
  const queryString = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    const finishAuth = async () => {
      const params = new URLSearchParams(queryString);
      const next = sanitizeAuthNext(params.get('next'));
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const expiresIn = hashParams.get('expires_in');
      const code = params.get('code');
      const providerFailure = collectAuthFailure(params, hashParams, 'missing_oauth_code');

      if (params.get('error') || params.get('error_code') || params.get('error_description') || hashParams.get('error') || hashParams.get('error_code') || hashParams.get('error_description')) {
        setStatus(`GITHUB AUTH RETURNED ERROR — ${providerFailure}`);
        return;
      }

      if (!code && !accessToken) {
        setStatus(`GITHUB AUTH MISSING CODE — ${providerFailure}`);
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const response = await fetch('/api/chaotica-auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          next,
          redirectTo,
          session: accessToken ? { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } : null,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const failure = [result?.error, result?.error_code, result?.error_description, result?.message].filter(Boolean).join(' | ');
        const configHint = result?.error === 'redirect_url_not_allowed' || /redirect/i.test(failure) ? ' — SUPABASE REDIRECT URL CONFIG REQUIRED' : '';
        setStatus(`GITHUB AUTH EXCHANGE FAILED — ${failure || response.statusText || response.status}${configHint}`);
        return;
      }

      const safeNext = sanitizeAuthNext(result?.next || next);
      router.replace(safeNext === '/' ? '/?chaotica-auth=complete' : safeNext);
    };

    finishAuth();
  }, [router, queryString]);

  return <div className="chaotica-opening-status" role="status">{status}</div>;
}

export default function AuthCallbackPage() {
  return (
    <main className="chaotica-opening">
      <Suspense fallback={<div className="chaotica-opening-status" role="status">AUTHORIZING THE GATE…</div>}>
        <AuthCallbackContent />
      </Suspense>
    </main>
  );
}
