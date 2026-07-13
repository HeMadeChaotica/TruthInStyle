'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('AUTHORIZING THE GATE…');

  useEffect(() => {
    const finishAuth = async () => {
      const next = searchParams.get('next') || '/';
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const expiresIn = hashParams.get('expires_in');
      const code = searchParams.get('code');
      const error = searchParams.get('error_description') || searchParams.get('error');

      if (error) {
        setStatus('GITHUB AUTH WAS CANCELLED OR BLOCKED.');
        window.setTimeout(() => router.replace('/'), 1200);
        return;
      }

      const response = await fetch('/api/chaotica-auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, session: accessToken ? { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } : null }),
      });

      if (!response.ok) {
        setStatus('GITHUB AUTH COULD NOT BE COMPLETED.');
        window.setTimeout(() => router.replace('/'), 1400);
        return;
      }

      router.replace(next === '/' ? '/?chaotica-auth=complete' : next);
    };

    finishAuth();
  }, [router, searchParams]);

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
