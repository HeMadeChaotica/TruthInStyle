'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSummationDraftFromAssurerDay, getChaoticaDayNumber, getStoredSummationActiveDay, isSummationSketchSealable, readAssurerDayForSummation, resolveSummationActiveDay, sealActiveSummationSelection, setStoredSummationActiveDay } from '../../src/services/summationService';

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

function mergeMissingTruth(base = {}, fallback = {}) {
  return Object.entries(fallback || {}).reduce((merged, [key, value]) => {
    if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
      return { ...merged, [key]: value };
    }
    return merged;
  }, { ...(base || {}) });
}

function dateFromSourceDate(sourceDate) {
  return sourceDate ? new Date(`${sourceDate}T00:00:00`) : null;
}

function hasCompleteDateMetadata(payload) {
  return Boolean(payload?.displayDate && payload?.sourceDate && payload?.dayOfWeek);
}

async function resolveSealSourceTruth(completed, draft, activeDate) {
  const completedFullSource = completed?.sourceTruthSnapshot || completed?.dayPayload || completed?.assurerDay || completed?.sourceDay || null;
  const draftDayPayload = draft?.dayPayload || null;
  const sourceDate = completedFullSource?.sourceDate || draftDayPayload?.sourceDate || completed?.sourceDate || completed?.sourceTruth?.sourceDate || localDateKey(activeDate);
  const activeDayPayload = await readAssurerDayForSummation(dateFromSourceDate(sourceDate) || activeDate).catch(() => null);

  let sourceTruth = {};
  if (hasCompleteDateMetadata(completedFullSource)) {
    sourceTruth = { ...completedFullSource };
  } else if (hasCompleteDateMetadata(draftDayPayload)) {
    sourceTruth = { ...draftDayPayload };
  } else if (hasCompleteDateMetadata(activeDayPayload)) {
    sourceTruth = { ...activeDayPayload };
  } else {
    sourceTruth = mergeMissingTruth(
      {
        sourceDate,
        displayDate: completed?.displayDate || draft?.displayDate,
        dayOfWeek: completed?.dayOfWeek,
      },
      completed?.sourceTruth || {},
    );
  }

  sourceTruth = mergeMissingTruth(sourceTruth, activeDayPayload || {});
  sourceTruth = mergeMissingTruth(sourceTruth, draftDayPayload || {});
  sourceTruth = mergeMissingTruth(sourceTruth, completedFullSource || {});
  sourceTruth = mergeMissingTruth(sourceTruth, {
    source: completed?.sourceTruth?.source || draft?.source || 'THE.ASSURER',
    sourceDate,
    displayDate: completed?.displayDate || draft?.displayDate,
    dayOfWeek: completed?.dayOfWeek,
    chaoticaDayNumber: completed?.chaoticaDayNumber || completed?.sourceTruth?.chaoticaDayNumber || getChaoticaDayNumber(sourceTruth.sourceDate || sourceDate),
    completedVariationId: completed?.variationId || completed?.id,
    completedPresetName: completed?.presetName || completed?.name,
    selectedVariationId: completed?.variationId || completed?.id,
    selectedVariationName: completed?.presetName || completed?.name,
    selectedSummationContent: completed,
  });
  sourceTruth = mergeMissingTruth(sourceTruth, completed?.sourceTruth || {});

  return sourceTruth;
}

function getSealBlockReason(sourceTruth, completed) {
  if (!sourceTruth?.displayDate) return 'THE.SUMMATION seal blocked: missing displayDate.';
  if (!sourceTruth?.sourceDate) return 'THE.SUMMATION seal blocked: missing sourceDate.';
  if (!sourceTruth?.dayOfWeek) return 'THE.SUMMATION seal blocked: missing dayOfWeek.';
  if (!isSummationSketchSealable(completed)) return 'THE.SUMMATION seal blocked: missing selected Summation content/version.';
  return '';
}

export default function ControlPanelOverlay({ isOpen = false, onOpen, onClose, onSelect }) {
  const router = useRouter();
  const initialDate = useMemo(() => new Date(), []);
  const [activeDate, setActiveDate] = useState(initialDate);
  const [draftDateText, setDraftDateText] = useState(displayDate(initialDate));
  const [draftDatePickerValue, setDraftDatePickerValue] = useState(localDateKey(initialDate));
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

  useEffect(() => {
    const stored = getStoredSummationActiveDay();
    const storedDate = stored?.sourceDate ? dateFromSourceDate(stored.sourceDate) : null;
    if (storedDate) {
      setActiveDate(storedDate);
      setDraftDateText(displayDate(storedDate));
      setDraftDatePickerValue(localDateKey(storedDate));
    }
  }, []);

  const openEyePanel = () => {
    const stored = getStoredSummationActiveDay();
    const storedDate = stored?.sourceDate ? dateFromSourceDate(stored.sourceDate) : activeDate;
    setDraftDateText(displayDate(storedDate));
    setDraftDatePickerValue(localDateKey(storedDate));
    setDayPanelOpen(true);
    setStatus('EYE OF TRUTH OPEN');
  };

  const cancelDayChange = () => {
    setDraftDateText(displayDate(activeDate));
    setDraftDatePickerValue(localDateKey(activeDate));
    setDayPanelOpen(false);
    setStatus('ACTIVE DAY UNCHANGED');
  };

  const applyDayChange = () => {
    const parsed = parseDisplayDate(draftDateText);
    if (!parsed) {
      setStatus('USE MM/DD/YYYY');
      return;
    }
    const saved = setStoredSummationActiveDay(parsed);
    setActiveDate(parsed);
    setDraftDateText(displayDate(parsed));
    setDraftDatePickerValue(localDateKey(parsed));
    setDayPanelOpen(false);
    setStatus(`ACTIVE DAY ${saved.displayDate}`);
  };

  const handleSummate = async () => {
    const activeDay = await resolveSummationActiveDay();
    if (!activeDay?.sourceDate || !activeDay?.displayDate) {
      setStatus('Choose an active day with Eye of Truth first.');
      return;
    }
    const confirmed = window.confirm(`SUMMATE THE.ASSURER DAY ${activeDay.displayDate} INTO THE.SUMMATION?`);
    if (!confirmed) {
      setStatus('SUMMATE CANCELED');
      return;
    }

    const draftPayload = createSummationDraftFromAssurerDay(activeDay);
    if (!draftPayload) {
      setStatus('SUMMATE BLOCKED');
      return;
    }
    window.dispatchEvent(new CustomEvent(DRAFT_EVENT_NAME, { detail: { sourceDate: activeDay.sourceDate, draft: draftPayload } }));
    setStatus(`SUMMATED ${activeDay.displayDate}`);
    onClose?.();
    router.push('/the-summation');
  };

  const handleSeal = async () => {
    const completed = safeJsonParse(window.localStorage.getItem(COMPLETED_SUMMATION_KEY), null);
    const result = sealActiveSummationSelection(completed);
    setStatus(result?.sealedRecord ? `SEALED ${result.sealedRecord.displayDate || result.sealedRecord.sourceDate}` : `SEAL BLOCKED: ${(result?.missingFields || []).join(', ')}`);
  };

  const handleRailItem = (item) => {
    if (item.key === 'eye-of-truth') {
      if (dayPanelOpen) cancelDayChange();
      else openEyePanel();
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
                    <input
                      type="date"
                      value={draftDatePickerValue}
                      onChange={(event) => {
                        const picked = dateFromSourceDate(event.target.value);
                        setDraftDatePickerValue(event.target.value);
                        if (picked) setDraftDateText(displayDate(picked));
                      }}
                      aria-label="Pick active day"
                    />
                  </label>
                  <div className="tis-day-popover-actions">
                    <button type="button" onClick={applyDayChange}>APPLY DAY</button>
                    <button type="button" onClick={cancelDayChange}>CANCEL</button>
                  </div>
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
