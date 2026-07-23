'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SupabaseGatePlaque from './SupabaseGatePlaque';

const OATH_TEXT = 'Eugene this is your safest place. Tell it all! Tell it true! Tell it so you will remember how you got through';

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function ChaoticaOpeningGate() {
  const router = useRouter();
  const recognitionRef = useRef(null);
  const [phase, setPhase] = useState('closed');
  const [typedOath, setTypedOath] = useState('');
  const [heardOath, setHeardOath] = useState('');
  const [message, setMessage] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);

  const typedOathIsExact = useMemo(() => normalize(typedOath) === normalize(OATH_TEXT), [typedOath]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognition));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authFailure = params.get('chaotica-auth-error');
    if (authFailure) {
      setPhase('auth');
      setMessage(authFailure);
      if (window.history.replaceState) window.history.replaceState(null, '', '/');
      return undefined;
    }

    if (params.get('chaotica-auth') !== 'complete') return undefined;
    let cancelled = false;
    const verifyReturnedSession = async () => {
      const response = await fetch('/api/chaotica-auth/session', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!cancelled && payload.authorized) setPhase('oath');
      if (!cancelled && !payload.authorized) {
        setPhase('auth');
        setMessage([payload.error, payload.error_description].filter(Boolean).join(' | ') || 'SESSION WAS NOT VERIFIED.');
      }
      if (window.history.replaceState) window.history.replaceState(null, '', '/');
    };
    verifyReturnedSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => recognitionRef.current?.stop?.(), []);

  const checkSession = async () => {
    setMessage('');
    const response = await fetch('/api/chaotica-auth/session', { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (payload.authorized) {
      setPhase('oath');
      return;
    }
    if (payload.configured === false) setMessage('SUPABASE AUTH IS NOT CONFIGURED.');
    setPhase('auth');
  };

  const startSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage('TYPE THE OATH TO CONTINUE.');
      return;
    }
    recognitionRef.current?.stop?.();
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0]?.transcript || '').join(' ');
      setHeardOath(transcript);
      if (normalize(transcript)) setMessage('THE OATH HAS BEEN HEARD. TYPE THE OATH TO OPEN CHAOTICA.');
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setMessage('TYPE THE OATH TO CONTINUE.');
    };
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const submitTypedOath = () => {
    if (!typedOathIsExact) {
      setMessage('THE TYPED OATH MUST MATCH THE OATH ABOVE.');
      return;
    }
    recognitionRef.current?.stop?.();
    setListening(false);
    setMessage('THE OATH HAS BEEN RECEIVED. CHAOTICA IS OPENING.');
    setPhase('opening');
    window.setTimeout(() => router.push('/the-assurer'), 900);
  };

  return (
    <main className="chaotica-opening" data-phase={phase}>
      <img
        className="chaotica-opening-image chaotica-opening-image-closed"
        src="/opening/chaotica-opening-entrance-closed.png"
        alt=""
        draggable={false}
        aria-hidden="true"
      />
      <img
        className="chaotica-opening-image chaotica-opening-image-activated"
        src="/opening/chaotica-opening-entrance-activated.png"
        alt=""
        draggable={false}
        aria-hidden="true"
      />
      <button type="button" className="chaotica-truth-stone" onClick={checkSession} aria-label="Open Chaotica" />
      {phase === 'auth' ? <SupabaseGatePlaque onAuthorized={() => setPhase('oath')} /> : null}
      {phase === 'oath' || phase === 'opening' ? (
        <section className="chaotica-oath" aria-label="Opening oath">
          <h1>Speak the Oath</h1>
          <p>{OATH_TEXT}</p>
          <div className="chaotica-oath-actions">
            <button type="button" onClick={startSpeech} disabled={listening}>
              {listening ? 'LISTENING' : speechSupported ? 'SPEAK' : 'SPEECH UNAVAILABLE'}
            </button>
            <span>{heardOath ? 'OATH HEARD' : 'AWAITING OATH'}</span>
          </div>
          <textarea
            value={typedOath}
            onChange={(event) => setTypedOath(event.target.value)}
            placeholder="Typed oath fallback"
            rows={3}
          />
          <button type="button" onClick={submitTypedOath} disabled={!typedOath.trim() || phase === 'opening'}>
            {phase === 'opening' ? 'OPENING' : 'ENTER CHAOTICA'}
          </button>
        </section>
      ) : null}
      {message ? <div className="chaotica-opening-status" role="status">{message}</div> : null}
    </main>
  );
}
