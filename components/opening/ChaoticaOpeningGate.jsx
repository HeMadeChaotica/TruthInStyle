'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SupabaseGatePlaque from './SupabaseGatePlaque';

const OATH_TEXT = 'Eugene this is your safest place. Tell it all! Tell it true! Tell it so you will remember how you got through';
const OATH_PHRASES = ['safest place', 'tell it all', 'tell it true', 'remember how you got through'];
const GATE_RELEASE_KEY = 'chaotica-gate-released-v1';
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
  const restartTimerRef = useRef(null);
  const [phase, setPhase] = useState('email');
  const [heardOath, setHeardOath] = useState('');
  const [message, setMessage] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);

  const oathPiecesHeard = countMatchedPhrases(heardOath);
  const spokenOathIsAccepted = oathPiecesHeard >= 3;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(Boolean(window.ChaoticaNativeSpeech?.start || SpeechRecognition));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('chaotica-auth') && !params.get('chaotica-auth-error') && window.sessionStorage.getItem(GATE_RELEASE_KEY) === 'true') {
      router.replace('/the-assurer');
      return undefined;
    }
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
  }, [router]);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    window.ChaoticaNativeSpeech?.stop?.();
    window.clearTimeout(restartTimerRef.current);
  }, []);

  useEffect(() => {
    const onNativeSpeech = (event) => {
      const detail = event.detail || {};
      if (detail.type === 'result' && detail.transcript) {
        setHeardOath((current) => {
          const next = String(detail.transcript);
          return normalize(next).includes(normalize(current)) ? next : `${current} ${next}`.trim();
        });
        setMessage('THE OATH HAS BEEN HEARD. KEEP SPEAKING.');
      }
      if (detail.type === 'listening') {
        setListening(true);
        setMessage('CHAOTICA IS LISTENING. SPEAK THE OATH.');
      }
      if (detail.type === 'ended' && phase === 'oath') {
        setListening(false);
        window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = window.setTimeout(() => startSpeech(), 350);
      }
      if (detail.type === 'error') {
        setListening(false);
        setMessage(detail.message || 'SPOKEN OATH COULD NOT HEAR YOU. LISTENING AGAIN.');
        if (phase === 'oath') {
          window.clearTimeout(restartTimerRef.current);
          restartTimerRef.current = window.setTimeout(() => startSpeech(), 750);
        }
      }
    };
    window.addEventListener('chaotica-native-speech', onNativeSpeech);
    return () => window.removeEventListener('chaotica-native-speech', onNativeSpeech);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'oath') return undefined;
    setHeardOath('');
    const timer = window.setTimeout(() => startSpeech(), 180);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'oath' || !spokenOathIsAccepted) return undefined;
    recognitionRef.current?.stop?.();
    window.ChaoticaNativeSpeech?.stop?.();
    setListening(false);
    setMessage('THE OATH HAS BEEN HEARD AND ACCEPTED. CHAOTICA IS OPENING.');
    window.sessionStorage.setItem(GATE_RELEASE_KEY, 'true');
    setPhase('opening');
    const timer = window.setTimeout(() => router.replace('/the-assurer'), 1050);
    return () => window.clearTimeout(timer);
  }, [phase, router, spokenOathIsAccepted]);

  const startSpeech = () => {
    if (window.ChaoticaNativeSpeech?.start) {
      setListening(true);
      setMessage('CHAOTICA IS LISTENING. SPEAK THE OATH.');
      window.ChaoticaNativeSpeech.start();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage('SPOKEN OATH IS UNAVAILABLE IN THIS BROWSER. OPEN CHAOTICA DESKTOP.');
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
      setMessage('SPEECH PAUSED. LISTENING AGAIN.');
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = window.setTimeout(() => startSpeech(), 750);
    };
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
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
          <div className="chaotica-oath-listener" data-listening={listening} aria-live="polite">
            <span className="chaotica-oath-listener-orb" aria-hidden="true" />
            <strong>{listening ? 'THE SEAL IS LISTENING' : 'THE SEAL IS READY'}</strong>
            <span>{oathPiecesHeard}/3 OATH PIECES HEARD</span>
          </div>
          <div className="chaotica-oath-actions">
            <button type="button" onClick={startSpeech} disabled={listening}>
              {listening ? 'LISTENING' : speechSupported ? 'LISTEN AGAIN' : 'SPEECH UNAVAILABLE'}
            </button>
            <span>{spokenOathIsAccepted ? 'OATH ACCEPTED' : heardOath ? 'OATH HEARD' : 'SPEAK WHEN READY'}</span>
          </div>
        </section>
      ) : null}
      {message ? <div className="chaotica-opening-status" role="status">{message}</div> : null}
    </main>
  );
}
