'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readAssurerDayForSummation, sealSummationVariation } from '../../src/services/summationService';

const SUMMATION_DRAFT_KEY = 'the_summation_active_draft_v1';
const COMPLETED_SUMMATION_KEY = 'completed_summation_sketch';
const DRAFT_EVENT_NAME = 'truthinstyle-summation-draft';

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

export default function SacredActionCluster() {
  const router = useRouter();
  const initialDate = useMemo(() => new Date(), []);
  const [activeDate, setActiveDate] = useState(initialDate);
  const [draftDateText, setDraftDateText] = useState(displayDate(initialDate));
  const [dayPanelOpen, setDayPanelOpen] = useState(false);
  const [now, setNow] = useState(initialDate);
  const [status, setStatus] = useState('');

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
    const draftPayload = {
      source: 'THE.ASSURER',
      sourceDate: selectedDayPayload.sourceDate,
      displayDate: selectedDayPayload.displayDate,
      dayPayload: selectedDayPayload,
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem(SUMMATION_DRAFT_KEY, JSON.stringify(draftPayload));
    window.dispatchEvent(new CustomEvent(DRAFT_EVENT_NAME, { detail: { sourceDate: selectedDayPayload.sourceDate, draft: draftPayload } }));
    setStatus(`SUMMATED ${selectedDayPayload.displayDate}`);
    router.push('/the-summation');
  };

  const handleSeal = () => {
    const completed = safeJsonParse(window.localStorage.getItem(COMPLETED_SUMMATION_KEY), null);
    if (!completed) {
      setStatus('COMPLETE THE.SUMMATION FIRST');
      return;
    }
    const sourceDate = completed?.sourceTruth?.sourceDate || completed?.sourceDate || activeDateKey;
    const sourceDay = completed?.sourceTruth || { sourceDate, displayDate: completed.displayDate || displayDate(activeDate), dayOfWeek: completed.dayOfWeek };
    const sealed = sealSummationVariation(sourceDay, completed);
    setStatus(sealed ? `SEALED ${sealed.displayDate || sealed.sourceDate}` : 'SEAL BLOCKED');
  };

  return (
    <div className="tis-sacred-cluster" aria-label="Sacred action cluster">
      {dayPanelOpen ? (
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
      <button type="button" className="tis-glyph-button tis-sacred-glyph" onClick={() => setDayPanelOpen((open) => !open)} aria-label="Eye of Truth" title="Eye of Truth">
        <img src="/ui/glyphs/triggers/glyph-eye-of-truth.png" alt="" aria-hidden="true" />
      </button>
      <button type="button" className="tis-glyph-button tis-sacred-glyph" onClick={handleSummate} aria-label="Crystal Wand Summate" title="Crystal Wand Summate">
        <img src="/ui/glyphs/triggers/glyph-control-wand.png" alt="" aria-hidden="true" />
      </button>
      <button type="button" className="tis-glyph-button tis-sacred-glyph" onClick={handleSeal} aria-label="So Let It Be Done" title="So Let It Be Done">
        <img src="/ui/glyphs/triggers/glyph-so-let-it-be-done.png" alt="" aria-hidden="true" />
      </button>
    </div>
  );
}
