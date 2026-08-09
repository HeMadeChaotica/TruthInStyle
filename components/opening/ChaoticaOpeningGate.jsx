'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SupabaseGatePlaque from './SupabaseGatePlaque';

const OATH_TEXT = 'Eugene this is your safest place. Tell it all! Tell it true! Tell it so you will remember how you got through';
const OATH_PHRASES = ['safest place', 'tell it all', 'tell it true', 'remember how you got through'];
const SCENE_BY_PHASE = {
  email: '/opening/chaotica-gate-email.png',
  code: '/opening/chaotica-gate-code.png',
  oath: '/opening/chaotica-gate-oath.png',
  opening: '/opening/chaotica-gate-open.png',
};

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function countMatchedPhrases(value) {
  const normalized = normalize(value);
  return OATH_PHRASES.filter((phrase) => normalized.includes(phrase)).length;
}

export default function ChaoticaOpeningGate() {
  const router = useRouter();
  const recognitionRef = useRef(null);
  const [phase, setPhase] = useState('email');
  const [typedOath, setTypedOath] = useState('');
  const [heardOath, setHeardOath] = useState('');
  const [message, setMessage] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);

  const typedOathIsExact = useMemo(() => normalize(typedOath) === normalize(OATH_TEXT), [typedOath]);
  const spokenOathIsAccepted = useMemo(() => countMatchedPhrases(heardOath) >= 3, [heardOath]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognition));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authFailure = params.get('chaotica-auth-error');
    if (authFailure) {
      setPhase('email');
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
        setPhase('email');
        setMessage([payload.error, payload.error_description].filter(Boolean).join(' | ') || 'SESSION WAS NOT VERIFIED.');
      }
      if (window.history.replaceState) window.history.replaceState(null, '', '/');
    };
    verifyReturnedSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
  }, []);

  useEffect(() => {
    if (phase !== 'oath' || !spokenOathIsAccepted) return undefined;
    recognitionRef.current?.stop?.();
    setListening(false);
    setMessage('THE OATH HAS BEEN HEARD AND ACCEPTED. CHAOTICA IS OPENING.');
    setPhase('opening');
    const timer = window.setTimeout(() => router.push('/the-assurer'), 1800);
    return () => window.clearTimeout(timer);
  }, [phase, router, spokenOathIsAccepted]);

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
      if (normalize(transcript)) setMessage('THE OATH HAS BEEN HEARD. KEEP SPEAKING.');
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setMessage('SPEECH PAUSED. SPEAK AGAIN OR USE THE TYPED FALLBACK.');
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
    window.setTimeout(() => router.push('/the-assurer'), 1800);
  };

  return (
    <main className="chaotica-opening" data-phase={phase}>
      <div className="chaotica-opening-scenes" aria-hidden="true">
        {Object.entries(SCENE_BY_PHASE).map(([scene, source]) => (
          <img
            key={scene}
            className={`chaotica-opening-scene chaotica-opening-scene-${scene}`}
            src={source}
            alt=""
            draggable={false}
          />
        ))}
      </div>
      {phase === 'email' || phase === 'code' ? (
        <SupabaseGatePlaque
          onCodeSent={() => {
            setMessage('THE SEAL HAS RECOGNIZED YOU. ENTER THE CODE.');
            setPhase('code');
          }}
          onAuthorized={() => {
            setMessage('THE CODE IS TRUE. SPEAK THE OATH.');
            setPhase('oath');
          }}
        />
      ) : null}
      {phase === 'oath' ? (
        <section className="chaotica-oath" aria-label="Opening oath">
          <h1>Speak the Oath</h1>
          <p>{OATH_TEXT}</p>
          <div className="chaotica-oath-actions">
            <button type="button" onClick={startSpeech} disabled={listening}>
              {listening ? 'LISTENING' : speechSupported ? 'SPEAK' : 'SPEECH UNAVAILABLE'}
            </button>
            <span>{spokenOathIsAccepted ? 'OATH ACCEPTED' : heardOath ? 'OATH HEARD' : 'AWAITING OATH'}</span>
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
