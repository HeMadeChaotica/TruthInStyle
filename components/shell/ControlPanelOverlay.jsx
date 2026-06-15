'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSummationDraftFromAssurerDay, readAssurerDayForSummation, sealActiveSummationSelection } from '../../src/services/summationService';

const SUMMATION_DRAFT_KEY = 'the_summation_active_draft_v1';
const COMPLETED_SUMMATION_KEY = 'completed_summation_sketch';
const DRAFT_EVENT_NAME = 'truthinstyle-summation-draft';

const RAIL_ITEMS = [
  { key: 'home', src: '/ui/glyphs/control%20panel/glyph-home.png', alt: 'HOME / THE.ASSURER', type: 'route' },
  { key: 'back', src: '/ui/glyphs/control%20panel/glyph-back.png', alt: 'Back', type: 'route' },
  { key: 'its-getting-thicc', src: '/ui/glyphs/control%20panel/glyph-its-getting-thicc.png', alt: 'ITS.GETTING.THICC', type: 'route' },
  { key: 'thicc-fitt', src: '/ui/glyphs/control%20panel/glyph-thicc-fitt.png', alt: 'THICC.FITT', type: 'route' },
  { key: 'da-eater', src: '/ui/glyphs/control%20panel/glyph-da-eater.png', alt: 'DA.EATER', type: 'route' },
  { key: 'remember-me', src: '/ui/glyphs/control%20panel/glyph-remember-me.png', alt: 'REMEMBER.ME', type: 'route' },
  { key: 'hopewood', src: '/ui/glyphs/control%20panel/glyph-hopewood.png', alt: 'HOPEWOOD', type: 'route' },
  { key: '525600', src: '/ui/glyphs/control%20panel/glyph-525600.png', alt: '525600', type: 'route' },
  { key: 'the-summation', src: '/ui/glyphs/control%20panel/glyph-the-summation.png', alt: 'THE.SUMMATION', type: 'route' },
  { key: 'clock-it', src: '/ui/glyphs/control%20panel/glyph-clock-it.png', alt: 'CLOCK.IT', type: 'route' },
  { key: 'eye-of-truth', src: '/ui/glyphs/triggers/glyph-eye-of-truth.png', alt: 'Eye of Truth', type: 'sacred' },
  { key: 'crystal-wand-summate', src: '/ui/glyphs/triggers/glyph-control-wand.png', alt: 'Crystal Wand / Summate', type: 'sacred' },
  { key: 'so-let-it-be-done', src: '/ui/glyphs/triggers/glyph-so-let-it-be-done.png', alt: 'So Let It Be Done', type: 'sacred' },
];

function pad(value) {
  return String(value).padStart(2, '0');
}

function localDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function displayDate(date) {
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
}

function parseDisplayDate(value) {
  const match = String(value || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
  return parsed;
}

function nextAutoSealDate(now) {
  const target = new Date(now);
  target.setHours(0, 1, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);
  return target;
}

function countdownToAutoSeal(now) {
  const diff = Math.max(0, nextAutoSealDate(now).getTime() - now.getTime());
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function safeJsonParse(raw, fallback = null) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

export default function ControlPanelOverlay({ isOpen = false, onOpen, onClose, onSelect }) {
  const router = useRouter();
  const initialDate = useMemo(() => new Date(), []);
  const [activeDate, setActiveDate] = useState(initialDate);
  const [draftDateText, setDraftDateText] = useState(displayDate(initialDate));
  const [dayPanelOpen, setDayPanelOpen] = useState(false);
  const [now, setNow] = useState(initialDate);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeDateKey = localDateKey(activeDate);

  const applyDayChange = () => {
    const parsed = parseDisplayDate(draftDateText);
    if (!parsed) {
      setStatus('USE MM/DD/YYYY');
      return;
    }
    setActiveDate(parsed);
    setDraftDateText(displayDate(parsed));
    setStatus(`ACTIVE DAY ${displayDate(parsed)}`);
  };

  const handleSummate = async () => {
    const selectedDate = new Date(activeDate.getTime());
    const selectedDisplayDate = displayDate(selectedDate);
    const confirmed = window.confirm(`SUMMATE THE.ASSURER DAY ${selectedDisplayDate} INTO THE.SUMMATION?`);
    if (!confirmed) {
      setStatus('SUMMATE CANCELED');
      return;
    }

    const selectedDayPayload = await readAssurerDayForSummation(selectedDate);
    const draftPayload = createSummationDraftFromAssurerDay(selectedDayPayload);
    if (!draftPayload) {
      setStatus('SUMMATE BLOCKED');
      return;
    }
    window.dispatchEvent(new CustomEvent(DRAFT_EVENT_NAME, { detail: { sourceDate: selectedDayPayload.sourceDate, draft: draftPayload } }));
    setStatus(`SUMMATED ${selectedDayPayload.displayDate}`);
    onClose?.();
    router.push('/the-summation');
  };

  const handleSeal = () => {
    const completed = safeJsonParse(window.localStorage.getItem(COMPLETED_SUMMATION_KEY), null);
    const result = sealActiveSummationSelection(completed);
    setStatus(result?.sealedRecord ? `SEALED ${result.sealedRecord.displayDate || result.sealedRecord.sourceDate}` : `SEAL BLOCKED: ${(result?.missingFields || []).join(', ')}`);
  };

  const handleRailItem = (item) => {
    if (item.key === 'eye-of-truth') {
      setDayPanelOpen((open) => !open);
      return;
    }
    if (item.key === 'crystal-wand-summate') {
      handleSummate();
      return;
    }
    if (item.key === 'so-let-it-be-done') {
      handleSeal();
      return;
    }
    onSelect?.(item.key);
  };

  return (
    <>
      <button type="button" className="tis-rail-tab" aria-expanded={isOpen} aria-controls="tis-control-rail" onClick={() => (isOpen ? onClose?.() : onOpen?.())}>☽</button>
      <aside className="tis-control-overlay" aria-hidden={!isOpen} data-open={isOpen}>
        <div className="tis-control-scrim" onClick={() => onClose?.()} />
        <nav id="tis-control-rail" className="tis-control-rail" aria-label="Right-side global control rail">
          {RAIL_ITEMS.map((item) => (
            <div key={item.key} className="tis-rail-control">
              <button type="button" className="tis-glyph-button tis-rail-glyph" onClick={() => handleRailItem(item)} aria-label={item.alt} title={item.alt}>
                <img src={item.src} alt="" draggable={false} aria-hidden="true" />
              </button>
              {item.key === 'eye-of-truth' && dayPanelOpen ? (
                <section className="tis-day-popover" aria-label="Eye of Truth day control">
                  <strong>ACTIVE DAY {displayDate(activeDate)}</strong>
                  <span>12:01 AM AUTO-SEAL IN {countdownToAutoSeal(now)}</span>
                  <label>
                    CHANGE / BACKFILL DAY
                    <input
                      value={draftDateText}
                      onChange={(event) => setDraftDateText(event.target.value)}
                      placeholder="MM/DD/YYYY"
                      inputMode="numeric"
                    />
                  </label>
                  <button type="button" onClick={applyDayChange}>SET ACTIVE DAY</button>
                  {status ? <span aria-live="polite">{status}</span> : null}
                </section>
              ) : null}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
