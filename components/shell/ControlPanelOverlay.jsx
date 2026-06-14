'use client';

import { useEffect, useMemo, useState } from 'react';

const ACTIVE_DAY_KEY = 'truthinstyle_active_day';

const ROUTE_ITEMS = [
  { key: 'home', src: '/ui/glyphs/control%20panel/glyph-home.png', alt: 'HOME / THE.ASSURER' },
  { key: 'back', src: '/ui/glyphs/control%20panel/glyph-back.png', alt: 'Back' },
  { key: 'its-getting-thicc', src: '/ui/glyphs/control%20panel/glyph-its-getting-thicc.png', alt: 'ITS.GETTING.THICC' },
  { key: 'thicc-fitt', src: '/ui/glyphs/control%20panel/glyph-thicc-fitt.png', alt: 'THICC.FITT' },
  { key: 'da-eater', src: '/ui/glyphs/control%20panel/glyph-da-eater.png', alt: 'DA.EATER' },
  { key: 'remember-me', src: '/ui/glyphs/control%20panel/glyph-remember-me.png', alt: 'REMEMBER.ME' },
  { key: 'hopewood', src: '/ui/glyphs/control%20panel/glyph-hopewood.png', alt: 'HOPEWOOD' },
  { key: '525600', src: '/ui/glyphs/control%20panel/glyph-525600.png', alt: '525600' },
  { key: 'the-summation', src: '/ui/glyphs/control%20panel/glyph-the-summation.png', alt: 'THE.SUMMATION' },
  { key: 'clock-it', src: '/ui/glyphs/control%20panel/glyph-clock-it.png', alt: 'CLOCK.IT' },
];

const ACTION_ITEMS = [
  { key: 'eye', src: '/ui/glyphs/triggers/glyph-eye-of-truth.png', alt: 'Eye of Truth' },
  { key: 'summate', src: '/ui/glyphs/triggers/glyph-control-wand.png', alt: 'Crystal Wand / Summate' },
  { key: 'so-let-it-be-done', src: '/ui/glyphs/triggers/glyph-so-let-it-be-done.png', alt: 'So Let It Be Done' },
];

function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateKey) {
  const [year, month, day] = String(dateKey || '').split('-');
  return year && month && day ? `${month}/${day}/${year}` : '';
}

function msUntilAutoSeal() {
  const now = new Date();
  const nextSeal = new Date(now);
  nextSeal.setDate(now.getDate() + (now.getHours() > 0 || now.getMinutes() >= 1 ? 1 : 0));
  nextSeal.setHours(0, 1, 0, 0);
  return Math.max(0, nextSeal.getTime() - now.getTime());
}

function formatCountdown(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function readActiveDayKey() {
  if (typeof window === 'undefined') return toDateKey();
  return window.localStorage.getItem(ACTIVE_DAY_KEY) || toDateKey();
}

export default function ControlPanelOverlay({ isOpen = false, onOpen, onClose, onSelect, onSummate, onSoLetItBeDone }) {
  const [dayControlOpen, setDayControlOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(() => readActiveDayKey());
  const [countdown, setCountdown] = useState(() => formatCountdown(msUntilAutoSeal()));

  useEffect(() => {
    const tick = () => setCountdown(formatCountdown(msUntilAutoSeal()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACTIVE_DAY_KEY, activeDay);
    window.dispatchEvent(new CustomEvent('truthinstyle-active-day-change', { detail: { activeDay } }));
  }, [activeDay]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const dayStatus = useMemo(() => activeDay === toDateKey() ? 'TODAY ACTIVE' : 'BACKFILL ACTIVE', [activeDay]);

  return (
    <>
      <button type="button" className="tis-rail-tab" aria-expanded={isOpen} aria-controls="tis-control-rail" onClick={() => (isOpen ? onClose?.() : onOpen?.())}>☽</button>
      <aside className="tis-control-overlay" aria-hidden={!isOpen} data-open={isOpen}>
        <div className="tis-control-scrim" onClick={() => onClose?.()} />
        <nav id="tis-control-rail" className="tis-control-rail" aria-label="Right-side control panel navigation">
          {ROUTE_ITEMS.map((item) => (
            <button key={item.key} type="button" className="tis-glyph-button tis-rail-glyph" onClick={() => onSelect?.(item.key)} aria-label={item.alt}>
              <img src={item.src} alt="" draggable={false} />
            </button>
          ))}
        </nav>
      </aside>
      <div className="tis-sacred-cluster" aria-label="Sacred action cluster">
        {ACTION_ITEMS.map((item) => (
          <button key={item.key} type="button" className="tis-glyph-button tis-sacred-glyph" aria-label={item.alt} onClick={() => {
            if (item.key === 'eye') setDayControlOpen((open) => !open);
            if (item.key === 'summate') onSummate?.(activeDay);
            if (item.key === 'so-let-it-be-done') onSoLetItBeDone?.();
          }}><img src={item.src} alt="" draggable={false} /></button>
        ))}
        {dayControlOpen && <section className="tis-day-popover" aria-label="Eye of Truth day changer">
          <strong>{formatDisplayDate(activeDay)}</strong>
          <span>{dayStatus}</span>
          <span>12:01 AUTO-SEAL IN {countdown}</span>
          <label>ACTIVE DAY<input type="date" value={activeDay} max={toDateKey()} onChange={(e) => setActiveDay(e.target.value || toDateKey())} /></label>
        </section>}
      </div>
    </>
  );
}
