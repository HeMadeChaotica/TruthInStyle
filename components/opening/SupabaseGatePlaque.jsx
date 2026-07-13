'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SupabaseGatePlaque() {
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const continueWithGithub = async () => {
    if (submitting) return;
    setSubmitting(true);
    setStatus('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        },
      });
      if (error) {
        setStatus('GITHUB AUTH IS NOT CONFIGURED.');
        setSubmitting(false);
      }
    } catch {
      setStatus('GITHUB AUTH COULD NOT OPEN.');
      setSubmitting(false);
    }
  };

  return (
    <section className="chaotica-auth-plaque" aria-label="Gate authorization plaque">
      <h2>AUTHORIZE THE GATE</h2>
      <p>Continue with GitHub to enter Chaotica.</p>
      <button type="button" onClick={continueWithGithub} disabled={submitting}>
        {submitting ? 'OPENING GITHUB…' : 'Continue with GitHub'}
      </button>
      {status ? <span role="alert">{status}</span> : null}
    </section>
  );
}
