'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDayCapsulePayloadFromActiveDay, createSummationDraftFromAssurerDay, getChaoticaDayNumber, getStoredSummationActiveDay, isSummationSketchSealable, readAssurerDayForSummation, resolveSummationActiveDay, sealCurrentDayCapsuleToHopewood, setStoredSummationActiveDay } from '../../src/services/summationService';

const DRAFT_EVENT_NAME = 'truthinstyle-summation-draft';
const OPEN_EYE_EVENT_NAME = 'truthinstyle-open-eye-of-truth';
const SUMMATE_RENDER_EVENT_NAME = 'truthinstyle-summation-render-request';
const PENDING_SUMMATE_RENDER_KEY = 'truthinstyle-pending-summation-render';

const RAIL_ITEMS = [
  { key: 'entrance', src: '/opening/chaotica-opening-entrance-closed.png', alt: 'EXIT TO ENTRANCE', type: 'route', className: 'tis-entrance-glyph' },
  { key: 'home', src: '/ui/glyphs/control%20panel/glyph-home-crystallization-v2.png', alt: 'HOME / THE.ASSURER', type: 'route' },
  { key: 'back', src: '/ui/glyphs/control%20panel/glyph-back-crystallization-v3.png', alt: 'Back', type: 'route' },
  { key: 'its-getting-thicc', src: '/ui/glyphs/control%20panel/glyph-its-getting-thicc-crystallization-v2.png', alt: 'ITS.GETTING.THICC', type: 'route' },
  { key: 'thicc-fitt', src: '/ui/glyphs/control%20panel/glyph-thicc-fitt-crystallization-v2.png', alt: 'THICC.FITT', type: 'route' },
  { key: 'da-eater', src: '/ui/glyphs/control%20panel/glyph-da-eater-crystallization-v2.png', alt: 'DA.EATER', type: 'route' },
  { key: 'remember-me', src: '/ui/glyphs/control%20panel/glyph-remember-me-crystallization-v2.png', alt: 'REMEMBER.ME', type: 'route' },
  { key: 'hopewood', src: '/ui/glyphs/control%20panel/glyph-hopewood-crystallization-v2.png', alt: 'HOPEWOOD', type: 'route' },
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

export default function ControlPanelOverlay({ isOpen = false, onOpen, onClose, onSelect, exitStatus = '', exitWarning = false, onRetryExit, onExitAnyway }) {
  const router = useRouter();
  const initialDate = useMemo(() => new Date(), []);
  const [activeDate, setActiveDate] = useState(initialDate);
  const [draftDateText, setDraftDateText] = useState(displayDate(initialDate));
  const [draftDatePickerValue, setDraftDatePickerValue] = useState(localDateKey(initialDate));
  const [dayPanelOpen, setDayPanelOpen] = useState(false);
  const [now, setNow] = useState(initialDate);
  const [status, setStatus] = useState('');
  const eyeButtonRef = useRef(null);
  const [dayPanelPosition, setDayPanelPosition] = useState({ top: 96, right: 96 });

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) return;
    setDayPanelOpen(false);
  }, [isOpen]);

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
      return;
    }
    const initial = setStoredSummationActiveDay(new Date());
    const initialDate = dateFromSourceDate(initial?.sourceDate) || new Date();
    setActiveDate(initialDate);
    setDraftDateText(displayDate(initialDate));
    setDraftDatePickerValue(localDateKey(initialDate));
  }, []);

  const updateDayPanelPosition = useCallback(() => {
    const button = eyeButtonRef.current;
    if (!button || typeof window === 'undefined') return;

    const rect = button.getBoundingClientRect();
    const safeGap = 12;
    const estimatedPanelHeight = 260;
    const top = Math.min(
      Math.max(rect.top, safeGap),
      Math.max(safeGap, window.innerHeight - estimatedPanelHeight - safeGap),
    );
    const right = Math.max(safeGap, window.innerWidth - rect.left + 10);

    setDayPanelPosition({ top, right });
  }, []);

  useEffect(() => {
    if (!dayPanelOpen || !isOpen) return undefined;

    updateDayPanelPosition();
    window.addEventListener('resize', updateDayPanelPosition);
    window.addEventListener('scroll', updateDayPanelPosition, true);

    return () => {
      window.removeEventListener('resize', updateDayPanelPosition);
      window.removeEventListener('scroll', updateDayPanelPosition, true);
    };
  }, [dayPanelOpen, isOpen, updateDayPanelPosition]);

  const openEyePanel = useCallback(() => {
    updateDayPanelPosition();
    const stored = getStoredSummationActiveDay();
    const storedDate = stored?.sourceDate ? dateFromSourceDate(stored.sourceDate) : activeDate;
    setDraftDateText(displayDate(storedDate));
    setDraftDatePickerValue(localDateKey(storedDate));
    setDayPanelOpen(true);
    setStatus('EYE OF TRUTH OPEN');
  }, [activeDate, updateDayPanelPosition]);

  useEffect(() => {
    const onOpenEye = () => {
      onOpen?.();
      openEyePanel();
    };
    window.addEventListener(OPEN_EYE_EVENT_NAME, onOpenEye);
    return () => window.removeEventListener(OPEN_EYE_EVENT_NAME, onOpenEye);
  }, [onOpen, openEyePanel]);

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
    setStoredSummationActiveDay(activeDate);
    const result = await createDayCapsulePayloadFromActiveDay();
    if (!result?.payload) {
      setStatus(result?.error || 'SUMMATE BLOCKED');
      return;
    }
    const detail = { sourceDate: result.payload.dayIdentity.sourceDate, payload: result.payload };
    window.dispatchEvent(new CustomEvent(DRAFT_EVENT_NAME, { detail }));
    window.sessionStorage.setItem(PENDING_SUMMATE_RENDER_KEY, JSON.stringify(detail));
    window.dispatchEvent(new CustomEvent(SUMMATE_RENDER_EVENT_NAME, { detail }));
    setStatus('Day Capsule render requested');
    onClose?.();
    router.push('/the-summation');
  };

  const handleSeal = async () => {
    setStatus('SEALING DAY CAPSULE...');
    try {
      const result = await sealCurrentDayCapsuleToHopewood();
      setStatus(result?.sealedRecord ? `SEALED ${result.sealedRecord.displayDate || result.sealedRecord.sourceDate}` : `SEAL BLOCKED: ${(result?.missingFields || []).join(', ')}`);
    } catch (error) {
      setStatus(`SEAL FAILED: ${error?.message || 'UNKNOWN ERROR'}`);
    }
  };

  const handleRailItem = async (item) => {
    if (item.key === 'eye-of-truth') {
      if (dayPanelOpen) cancelDayChange();
      else openEyePanel();
      return;
    }
    if (item.key === 'crystal-wand-summate') {
      await handleSummate();
      return;
    }
    if (item.key === 'so-let-it-be-done') {
      await handleSeal();
      return;
    }
    onSelect?.(item.key);
  };

  return (
    <>
      <button type="button" className="tis-rail-tab" aria-expanded={isOpen} aria-controls="tis-control-rail" aria-label={isOpen ? 'Close Control Panel' : 'Open Control Panel'} onClick={() => (isOpen ? onClose?.() : onOpen?.())}>
        <img className="tis-rail-tab-latch" src="/ui/glyphs/control%20panel/glyph-control-panel-heartgate-latch-v1.png" alt="" draggable={false} aria-hidden="true" />
      </button>
      <aside className="tis-control-overlay" aria-hidden={!isOpen} data-open={isOpen}>
        <div
          className="tis-control-scrim"
          onClick={() => {
            if (dayPanelOpen) cancelDayChange();
            onClose?.();
          }}
        />
        <nav id="tis-control-rail" className="tis-control-rail" aria-label="Right-side global control rail">
          {RAIL_ITEMS.map((item) => (
            <div key={item.key} className="tis-rail-control">
              <button type="button" className={`tis-glyph-button tis-rail-glyph ${item.className || ''}`} ref={item.key === 'eye-of-truth' ? eyeButtonRef : null} onClick={() => void handleRailItem(item)} aria-label={item.alt} title={item.alt}>
                <img src={item.src} alt="" draggable={false} aria-hidden="true" />
              </button>
            </div>
          ))}
        </nav>
        {(exitStatus || exitWarning) && isOpen ? (
          <section className="tis-exit-popover" aria-label="Entrance exit save status">
            <strong>{exitStatus || 'SAVE WARNING'}</strong>
            {exitWarning ? (
              <div className="tis-day-popover-actions">
                <button type="button" onClick={onRetryExit}>TRY AGAIN</button>
                <button type="button" onClick={onExitAnyway}>EXIT ANYWAY</button>
              </div>
            ) : null}
          </section>
        ) : null}
        {status && isOpen && !dayPanelOpen ? <div className="tis-control-status" role="status" aria-live="polite">{status}</div> : null}
        {dayPanelOpen && isOpen ? (
          <section
            className="tis-day-popover"
            style={{ '--tis-day-popover-top': `${dayPanelPosition.top}px`, '--tis-day-popover-right': `${dayPanelPosition.right}px` }}
            aria-label="Eye of Truth day control"
          >
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
      </aside>
    </>
  );
}
