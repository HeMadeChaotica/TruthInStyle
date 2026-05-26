'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/the-assurer.css';
import { buildThiccTimeAssurerPayload, loadClients, loadScheduleEntries } from '../../src/services/itsGettingThiccService';
import { getDaEaterDay } from '../../src/services/daEaterService';
import { loadLocalEntries } from '../../src/services/rememberMeService';
import { getAssurerFeed } from '../../src/services/assurerService';

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const toIso = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseNum = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const fmtDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
};

export default function TheAssurerSection() {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const today = new Date();
    const todayIso = toIso(today);
    const todayName = WEEKDAYS[today.getDay()];

    const thiccStateRaw = window.localStorage.getItem('thicc_fitt_day');
    let thiccState = null;
    try { thiccState = thiccStateRaw ? JSON.parse(thiccStateRaw) : null; } catch { thiccState = null; }

    const entries = loadLocalEntries();
    const scheduleRows = loadScheduleEntries();
    const scheduleByDate = scheduleRows.reduce((acc, row) => {
      if (!row?.entry_date) return acc;
      acc[row.entry_date] = [...(acc[row.entry_date] || []), row];
      return acc;
    }, {});

    const thiccTime = buildThiccTimeAssurerPayload(scheduleByDate, today);
    const clients = loadClients();
    const daDay = getDaEaterDay(todayIso);
    const feed = getAssurerFeed().filter((row) => row?.source === 'thicc-fitt');
    const latestFeed = feed.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0] || null;

    const recentEntries = thiccTime.entries.slice(0, 7);
    const thiccTotalClients = clients.filter((c) => c?.active !== false).length;

    const battleCry = thiccState?.battleCry || latestFeed?.battleCry || latestFeed?.soHowYouDoinNotes || 'Stay loud. Stay moving.';
    const exerciseLog = Array.isArray(thiccState?.exerciseRows)
      ? thiccState.exerciseRows.filter((r) => r?.exercise).slice(0, 4)
      : Array.isArray(latestFeed?.exerciseLogRows)
        ? latestFeed.exerciseLogRows.filter((r) => r?.exercise).slice(0, 4)
        : [];

    const howYouDoin = thiccState?.soHowYouDoin || latestFeed?.soHowYouDoinSelectedOption || '';
    const trophyWall = [thiccState?.photo?.progressPhotoRef, thiccState?.photo?.gymPhotoRef, latestFeed?.sessionPhoto].filter(Boolean);

    const caffeineByDay = DAY_KEYS.map((day) => parseNum(thiccState?.weeklyTrackers?.byDay?.[day]?.caffeineMg));
    const upupAvg = caffeineByDay.length ? (caffeineByDay.reduce((sum, n) => sum + n, 0) / caffeineByDay.length).toFixed(1) : '0.0';
    const sleepTotal = DAY_KEYS.reduce((sum, day) => sum + parseNum(thiccState?.weeklyTrackers?.byDay?.[day]?.sleep?.hoursSlept), 0).toFixed(1);

    const rememberWindow = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return toIso(d);
    });
    const rememberEvents = entries.filter((e) => e?.type === 'EVENT' && rememberWindow.includes(e.date)).slice(0, 6);
    const wow = entries.filter((e) => (e?.type || e?.standoutType) === 'WOW').slice(-3);
    const wtf = entries.filter((e) => (e?.type || e?.standoutType) === 'WTF').slice(-3);
    const plotTwist = entries.filter((e) => (e?.type || e?.standoutType) === 'PLOT TWIST').slice(-3);

    const mealLog = (daDay?.meals || []).slice(-4);
    const totals = (daDay?.meals || []).reduce((acc, meal) => ({
      protein: acc.protein + parseNum(meal?.protein),
      carbs: acc.carbs + parseNum(meal?.carbs),
      fats: acc.fats + parseNum(meal?.fats),
      calories: acc.calories + parseNum(meal?.calories),
      waterOz: acc.waterOz + parseNum(meal?.waterOz),
    }), { protein: 0, carbs: 0, fats: 0, calories: 0, waterOz: 0 });

    const targets = { protein: 250, carbs: 120, fats: 75, calories: 4500, waterOz: 128 };
    const progressBars = Object.entries(targets).map(([label, target]) => ({
      label: label.toUpperCase(),
      value: totals[label],
      pct: Math.max(0, Math.min(100, Math.round((totals[label] / target) * 100))),
    }));

    const allowedTreatDay = todayName === 'WEDNESDAY' || todayName === 'SATURDAY';
    const treatRows = allowedTreatDay ? (daDay?.cheatFlexEntries || []) : [];

    setSnapshot({
      thiccTime: recentEntries,
      thiccTotalClients,
      battleCry,
      exerciseLog,
      howYouDoin,
      trophyWall,
      upupAvg,
      sleepTotal,
      rememberEvents,
      wow,
      wtf,
      plotTwist,
      mealLog,
      progressBars,
      treatRows,
      allowedTreatDay,
      todayIso,
      todayName,
    });
  }, []);

  const nutrientBars = useMemo(() => snapshot?.progressBars || [], [snapshot]);

  return (
    <section className="assurer-shell" aria-label="THE.ASSURER">
      <div className="assurer-stage">
        <div className="assurer-scene-plate" role="img" aria-label="THE.ASSURER background" />

        <div className="assurer-overlay">
          <div className="assurer-top">
            <input className="assurer-title-input" type="text" value={snapshot?.battleCry || ''} readOnly aria-label="Battle cry" />

            <div className="assurer-bars" aria-label="Daily progress">
              {nutrientBars.map((bar) => (
                <div className="assurer-bar" key={bar.label}>
                  <div className="assurer-bar-meta">
                    <span>{bar.label}</span>
                    <span>{bar.value}</span>
                  </div>
                  <div className="assurer-bar-track">
                    <span className="assurer-bar-fill" style={{ width: `${bar.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="assurer-chip-row">
              <span className="assurer-chip">{snapshot?.todayName || 'TODAY'}</span>
              <span className="assurer-chip">Clients {snapshot?.thiccTotalClients ?? 0}</span>
              <span className="assurer-chip">UPUP avg {snapshot?.upupAvg || '0.0'}mg</span>
              <span className="assurer-chip">Sleep total {snapshot?.sleepTotal || '0.0'}h</span>
            </div>
          </div>

          <div className="assurer-content-grid">
            <div className="assurer-col assurer-col-left">
              <article className="assurer-panel assurer-list-panel">
                <h3>Mixed Signals</h3>
                {snapshot?.thiccTime?.map((entry, i) => <p key={`time-${i}`}>{entry.displayDate} · {entry.title || 'Session'} · {entry.startTime || 'time open'}</p>)}
                {snapshot?.mealLog?.map((meal) => <p key={meal.id}>{meal.type} · {meal.name || 'Untitled'} · {meal.time || '--:--'}</p>)}
                {snapshot?.rememberEvents?.map((event) => <p key={event.id}>{fmtDate(event.date)} · {event.time || '--:--'} · {event.description || event.detail || 'Event'}</p>)}
              </article>

              <article className="assurer-panel assurer-metrics">
                <div className="metric">How doin: {snapshot?.howYouDoin || '—'}</div>
                <div className="metric">Exercise rows: {snapshot?.exerciseLog?.length || 0}</div>
                <div className="metric">WOW: {snapshot?.wow?.length || 0}</div>
                <div className="metric">WTF: {snapshot?.wtf?.length || 0}</div>
                <div className="metric">Plot Twist: {snapshot?.plotTwist?.length || 0}</div>
                <div className="metric">Treats today: {snapshot?.treatRows?.length || 0}</div>
              </article>

              <article className="assurer-panel assurer-memory-strip">
                {(snapshot?.trophyWall || []).slice(0, 3).map((photo, i) => <div className="memory-tile" key={`trophy-${i}`}>{typeof photo === 'string' ? photo : (photo?.name || 'Photo')}</div>)}
              </article>
            </div>

            <div className="assurer-col assurer-col-right">
              <article className="assurer-panel assurer-thoughts">
                <h3>Exercise Log</h3>
                <textarea readOnly value={(snapshot?.exerciseLog || []).map((row) => `${row.exercise || 'Move'} ${row.weight || ''} ${row.reps || ''}x${row.sets || ''}`.trim()).join('\n')} />
              </article>

              <article className="assurer-panel assurer-timeline">
                <h3>Moments + Treat Window</h3>
                {(snapshot?.wow || []).map((row) => <p key={row.id}>WOW · {row.description || row.detail || 'moment'}</p>)}
                {(snapshot?.wtf || []).map((row) => <p key={row.id}>WTF · {row.description || row.detail || 'moment'}</p>)}
                {(snapshot?.plotTwist || []).map((row) => <p key={row.id}>PLOT · {row.description || row.detail || 'moment'}</p>)}
                <p>{snapshot?.allowedTreatDay ? 'Treat window live' : 'Treat window sleeps'}</p>
              </article>
            </div>
          </div>
        </div>

        <div className="assurer-clear-zone" aria-hidden="true" />
      </div>
    </section>
  );
}
