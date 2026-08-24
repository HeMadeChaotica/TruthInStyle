'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChaoticaPasswordPlaque from './ChaoticaPasswordPlaque';

const OATH_TEXT = 'Eugene this is your safest place. Tell it all! Tell it true! Tell it so you will remember how you got through';
const OATH_PHRASES = ['safest place', 'tell it all', 'tell it true', 'remember how you got through'];
const GATE_RELEASE_KEY = 'chaotica-gate-released-v1';
const SCENE_BY_PHASE = {
  password: '/opening/chaotica-opening-dormant-v1.png',
  oath: '/opening/chaotica-opening-awakened-v1.png',
  opening: '/opening/chaotica-opening-opened-v1.png',
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
  const phaseRef = useRef('password');
  const acceptedRef = useRef(false);
  const startSpeechRef = useRef(null);
  const [phase, setPhase] = useState('password');
  const [heardOath, setHeardOath] = useState('');
  const [message, setMessage] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechLevel, setSpeechLevel] = useState(0);
  const [passwordGateConfigured, setPasswordGateConfigured] = useState(null);

  const oathPiecesHeard = countMatchedPhrases(heardOath);
  const spokenOathIsAccepted = oathPiecesHeard >= 3;
  phaseRef.current = phase;
  acceptedRef.current = spokenOathIsAccepted;

  function scheduleSpeechRestart(delay = 650) {
    window.clearTimeout(restartTimerRef.current);
    if (phaseRef.current !== 'oath' || acceptedRef.current) return;
    restartTimerRef.current = window.setTimeout(() => {
      if (phaseRef.current === 'oath' && !acceptedRef.current) startSpeechRef.current?.();
    }, delay);
  }

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(Boolean(window.ChaoticaNativeSpeech?.start || SpeechRecognition));
  }, []);

  useEffect(() => {
    if (window.sessionStorage.getItem(GATE_RELEASE_KEY) === 'true') {
      router.replace('/the-assurer');
      return undefined;
    }
    let cancelled = false;
    const inspectGate = async () => {
      const response = await fetch('/api/chaotica-auth/session', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (cancelled) return;
      setPasswordGateConfigured(Boolean(payload.passwordGateConfigured));
      if (payload.authorized) {
        setPhase('oath');
      } else {
        setPhase('password');
      }
    };
    inspectGate();
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
        setMessage(`THE SEAL HEARD: ${detail.transcript}`);
      }
      if (detail.type === 'listening') {
        setListening(true);
        setMessage('CHAOTICA IS LISTENING. SPEAK THE OATH.');
      }
      if (detail.type === 'ended' && phaseRef.current === 'oath') {
        setListening(false);
        scheduleSpeechRestart();
      }
      if (detail.type === 'level') setSpeechLevel(Math.max(0, Math.min(1, Number(detail.level) || 0)));
      if (detail.type === 'quiet') setMessage('THE SEAL CANNOT HEAR WORDS YET. SPEAK CLOSER TO THE MACBOOK MICROPHONE.');
      if (detail.type === 'error') {
        setListening(false);
        setSpeechLevel(0);
        setMessage(detail.message || 'THE SPOKEN OATH LISTENER COULD NOT START.');
        const reason = normalize(detail.message);
        if (!reason.includes('permission') && !reason.includes('denied') && !reason.includes('not authorized')) {
          scheduleSpeechRestart(900);
        }
      }
    };
    window.addEventListener('chaotica-native-speech', onNativeSpeech);
    return () => window.removeEventListener('chaotica-native-speech', onNativeSpeech);
  }, []);

  useEffect(() => {
    if (phase !== 'oath') return undefined;
    setHeardOath('');
    setSpeechLevel(0);
    const timer = window.setTimeout(() => startSpeech(), 180);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'oath' || !spokenOathIsAccepted) return undefined;
    recognitionRef.current?.stop?.();
    window.ChaoticaNativeSpeech?.stop?.();
    setListening(false);
    setSpeechLevel(0);
    setMessage('THE OATH HAS BEEN HEARD AND ACCEPTED. CHAOTICA IS OPENING.');
    window.sessionStorage.setItem(GATE_RELEASE_KEY, 'true');
    setPhase('opening');
  }, [phase, router, spokenOathIsAccepted]);

  useEffect(() => {
    if (phase !== 'opening') return undefined;
    const timer = window.setTimeout(() => router.replace('/the-assurer'), 1050);
    return () => window.clearTimeout(timer);
  }, [phase, router]);

  function startSpeech() {
    if (phaseRef.current !== 'oath' || acceptedRef.current) return;
    window.clearTimeout(restartTimerRef.current);
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
    recognition.onend = () => {
      setListening(false);
      scheduleSpeechRestart();
    };
    recognition.onerror = (event) => {
      setListening(false);
      const terminalError = ['not-allowed', 'service-not-allowed'].includes(event?.error);
      setMessage(terminalError
        ? 'MICROPHONE ACCESS IS REQUIRED FOR THE SPOKEN OATH.'
        : 'THE SEAL PAUSED. LISTENING WILL RESUME AUTOMATICALLY.');
      if (!terminalError) scheduleSpeechRestart(900);
    };
    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      scheduleSpeechRestart(900);
    }
  }
  startSpeechRef.current = startSpeech;

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
      {phase === 'password' && passwordGateConfigured !== null ? (
        <ChaoticaPasswordPlaque
          onAuthorized={() => {
            setMessage('THE PASSWORD IS TRUE. SPEAK THE OATH.');
            setPhase('oath');
          }}
        />
      ) : null}
      {phase === 'oath' ? (
        <section className="chaotica-oath" aria-label="Opening oath">
          <h1>Speak the Oath</h1>
          <p>{OATH_TEXT}</p>
          <div className="chaotica-oath-listener" data-listening={listening} style={{ '--chaotica-voice-level': speechLevel }} aria-live="polite">
            <span className="chaotica-oath-listener-orb" aria-hidden="true" />
            <strong>{listening ? 'THE SEAL IS LISTENING' : 'THE SEAL IS READY'}</strong>
            <span className="chaotica-oath-crystals" aria-label={`${oathPiecesHeard} oath pieces heard`}>
              {[0, 1, 2].map((index) => <b key={index} data-heard={index < oathPiecesHeard} />)}
            </span>
            <i aria-hidden="true"><b /><b /><b /><b /><b /></i>
          </div>
          <div className="chaotica-oath-actions">
            {!speechSupported ? <button type="button" disabled>SPEECH UNAVAILABLE</button> : null}
            <span>{spokenOathIsAccepted ? 'OATH ACCEPTED' : heardOath ? 'OATH HEARD' : 'SPEAK WHEN READY'}</span>
          </div>
        </section>
      ) : null}
      {message ? <div className="chaotica-opening-status" role="status">{message}</div> : null}
    </main>
  );
}
