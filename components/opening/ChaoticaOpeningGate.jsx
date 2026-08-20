'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChaoticaPasswordPlaque from './ChaoticaPasswordPlaque';

const HEARTGATE_SCENE = '/opening/chaotica-heartgate-master-v1.png';
const OATH_SEGMENTS = [
  { phrase: 'safest place', text: 'Eugene, this is your safest place.' },
  { phrase: 'tell it all', text: 'Tell it all.' },
  { phrase: 'tell it true', text: 'Tell it true.' },
  { phrase: 'remember how you got through', text: 'Tell it so you will remember how you got through.' },
];
const OATH_PHRASES = OATH_SEGMENTS.map(({ phrase }) => phrase);
const GATE_RELEASE_KEY = 'chaotica-gate-released-v1';
const OPENING_DURATION_MS = 2900;

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function countMatchedPhrases(value) {
  const normalized = normalize(value);
  return OATH_PHRASES.filter((phrase) => normalized.includes(phrase)).length;
}

function currentAssurerScene() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return '/backgrounds/THE-ASSURER/the-assurer-morning-scene-v1.png';
  if (hour >= 11 && hour < 17) return '/backgrounds/THE-ASSURER/the-assurer-day-scene-v1.png';
  if (hour >= 17 && hour < 22) return '/backgrounds/THE-ASSURER/the-assurer-evening-scene-v1.png';
  return '/backgrounds/THE-ASSURER/the-assurer-night-scene-v1.png';
}

export default function ChaoticaOpeningGate() {
  const router = useRouter();
  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const phaseRef = useRef('password');
  const acceptedRef = useRef(false);
  const [phase, setPhase] = useState('password');
  const [heardOath, setHeardOath] = useState('');
  const [message, setMessage] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechLevel, setSpeechLevel] = useState(0);
  const [passwordGateConfigured, setPasswordGateConfigured] = useState(null);
  const [assurerArrivalScene] = useState(currentAssurerScene);

  const normalizedOath = normalize(heardOath);
  const oathPiecesHeard = countMatchedPhrases(heardOath);
  const spokenOathIsAccepted = oathPiecesHeard >= 3;
  const showStatus = Boolean(message) && /unavailable|could not|cannot hear|paused|permission|connection/i.test(message);

  useEffect(() => {
    phaseRef.current = phase;
    acceptedRef.current = spokenOathIsAccepted;
  }, [phase, spokenOathIsAccepted]);

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
      try {
        const response = await fetch('/api/chaotica-auth/session', { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (cancelled) return;
        setPasswordGateConfigured(Boolean(payload.passwordGateConfigured));
        setPhase(payload.authorized ? 'oath' : 'password');
      } catch {
        if (!cancelled) {
          setPasswordGateConfigured(false);
          setMessage('THE HEARTGATE COULD NOT REACH CHAOTICA. CHECK YOUR CONNECTION.');
        }
      }
    };
    inspectGate();
    return () => { cancelled = true; };
  }, [router]);

  const startSpeech = useCallback(() => {
    window.clearTimeout(restartTimerRef.current);

    if (window.ChaoticaNativeSpeech?.start) {
      setListening(true);
      setMessage('');
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
      setMessage('');
    };
    recognition.onend = () => {
      setListening(false);
      if (phaseRef.current === 'oath' && !acceptedRef.current) {
        restartTimerRef.current = window.setTimeout(() => startSpeech(), 420);
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setMessage('MICROPHONE PERMISSION IS NEEDED FOR THE SPOKEN OATH.');
        return;
      }
      setMessage('SPEECH PAUSED. CHAOTICA WILL LISTEN AGAIN.');
    };
    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      restartTimerRef.current = window.setTimeout(() => startSpeech(), 520);
    }
  }, []);

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
        setMessage('');
      }
      if (detail.type === 'listening') {
        setListening(true);
        setMessage('');
      }
      if (detail.type === 'ended' && phaseRef.current === 'oath' && !acceptedRef.current) {
        setListening(false);
        restartTimerRef.current = window.setTimeout(() => startSpeech(), 420);
      }
      if (detail.type === 'level') setSpeechLevel(Math.max(0, Math.min(1, Number(detail.level) || 0)));
      if (detail.type === 'quiet') setMessage('THE HEARTGATE CANNOT HEAR WORDS YET.');
      if (detail.type === 'error') {
        setListening(false);
        setSpeechLevel(0);
        setMessage(detail.message || 'THE SPOKEN OATH LISTENER COULD NOT START.');
      }
    };
    window.addEventListener('chaotica-native-speech', onNativeSpeech);
    return () => window.removeEventListener('chaotica-native-speech', onNativeSpeech);
  }, [startSpeech]);

  useEffect(() => {
    if (phase !== 'oath') return undefined;
    setHeardOath('');
    setSpeechLevel(0);
    const timer = window.setTimeout(() => startSpeech(), 280);
    return () => window.clearTimeout(timer);
  }, [phase, startSpeech]);

  useEffect(() => {
    if (phase !== 'oath' || !spokenOathIsAccepted) return undefined;
    recognitionRef.current?.stop?.();
    window.ChaoticaNativeSpeech?.stop?.();
    window.clearTimeout(restartTimerRef.current);
    setListening(false);
    setSpeechLevel(0);
    setMessage('');
    window.sessionStorage.setItem(GATE_RELEASE_KEY, 'true');
    setPhase('opening');
    return undefined;
  }, [phase, spokenOathIsAccepted]);

  useEffect(() => {
    if (phase !== 'opening') return undefined;
    const timer = window.setTimeout(() => router.replace('/the-assurer'), OPENING_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [phase, router]);

  return (
    <main className="chaotica-opening" data-phase={phase}>
      <div className="chaotica-opening-scenes" aria-hidden="true">
        <img className="chaotica-assurer-arrival-scene" src={assurerArrivalScene} alt="" draggable={false} />
        <img className="chaotica-heartgate-master" src={HEARTGATE_SCENE} alt="" draggable={false} />
        <div className="chaotica-heartgate-wing chaotica-heartgate-wing-left" />
        <div className="chaotica-heartgate-wing chaotica-heartgate-wing-right" />
        <div className="chaotica-heartgate-awakening">
          <span className="chaotica-crystal-eye chaotica-crystal-eye-left" />
          <span className="chaotica-crystal-eye chaotica-crystal-eye-right" />
          <span className="chaotica-heart-crystal" />
        </div>
        <div className="chaotica-opening-weave" />
        <div className="chaotica-opening-depth" />
      </div>

      {phase === 'password' && passwordGateConfigured !== null ? (
        <ChaoticaPasswordPlaque
          onAuthorized={() => {
            setMessage('');
            setPhase('oath');
          }}
        />
      ) : null}

      {phase === 'oath' ? (
        <section className="chaotica-oath" aria-label="Opening oath">
          <div className="chaotica-oath-copy" aria-label="Eugene, this is your safest place. Tell it all. Tell it true. Tell it so you will remember how you got through.">
            {OATH_SEGMENTS.map(({ phrase, text }) => (
              <span key={phrase} data-heard={normalizedOath.includes(phrase)}>{text}</span>
            ))}
          </div>
          <div className="chaotica-oath-listener" data-listening={listening} style={{ '--chaotica-voice-level': speechLevel }} aria-live="polite">
            <span className="chaotica-oath-listener-orb" aria-hidden="true" />
            <span className="chaotica-oath-crystals" aria-label={`${oathPiecesHeard} oath pieces heard`}>
              {[0, 1, 2].map((index) => <b key={index} data-heard={index < oathPiecesHeard} />)}
            </span>
            <i aria-hidden="true"><b /><b /><b /><b /><b /></i>
          </div>
          {!listening && speechSupported ? (
            <button className="chaotica-oath-retry" type="button" onClick={startSpeech}>LISTEN AGAIN</button>
          ) : null}
        </section>
      ) : null}

      {showStatus ? <div className="chaotica-opening-status" role="status">{message}</div> : null}
    </main>
  );
}
