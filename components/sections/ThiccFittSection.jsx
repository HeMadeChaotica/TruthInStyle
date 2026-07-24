'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/sections/thicc-fitt.css';
import '../../styles/sections/universal-frame.css';
import { optionRegistry } from '../../lib/dropdowns/optionRegistry';
import { CLOCK_IT_KEYS, useClockItNumericOptions, useClockItOptions } from '../../lib/dropdowns/clockItRegistry';
import { publishThiccFittSessionProof } from '../../src/services/assurerService';
import { getLocalDateKey } from '../../lib/theAssurer/localDateKey';
import { ArtLane, BlueprintStack, ContentScroller, ScenePlate, SectionOverlay, SectionShell } from '../shared/UniversalSectionFrame';
import { uploadPrivateImage } from '../../src/services/mediaUploadService';

const STORAGE_KEY = 'thicc_fitt_day';
const QUOTE_HISTORY_KEY = 'thicc_fitt_quote_history';
const EXERCISE_COUNT = 6;
const createExerciseRow = () => ({ exercise: '', weight: '', reps: '', sets: '', failure: 'N', rest: '' });
const normalizeExerciseRows = (rows) => {
  const source = Array.isArray(rows) ? rows : [];
  return Array.from({ length: EXERCISE_COUNT }, (_, index) => {
    const row = source[index] || {};
    return {
      exercise: String(row.exercise ?? ''),
      weight: String(row.weight ?? ''),
      reps: String(row.reps ?? ''),
      sets: String(row.sets ?? ''),
      failure: String(row.failure ?? 'N'),
      rest: String(row.rest ?? row.notes ?? '')
    };
  });
};
const bodyRows = [['weight', 'WEIGHT'], ['bodyFat', 'BODY FAT'], ['chest', 'CHEST'], ['waist', 'WAIST'], ['arms', 'ARMS L / R'], ['thighs', 'THIGHS L / R'], ['glutes', 'GLUTES']];
const todayKey = () => getLocalDateKey();
const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const getWeekStartKey = (date = new Date()) => { const d = new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay()); return getLocalDateKey(d); };
const parseDurationMinutes = (value) => { if (!value) return 0; const text = String(value).trim().toLowerCase(); const hhmm = text.match(/^(\d{1,2}):(\d{2})$/); if (hhmm) return Number(hhmm[1]) * 60 + Number(hhmm[2]); const h=text.match(/(\d+(?:\.\d+)?)\s*h/); const m=text.match(/(\d+)\s*m/); if (h||m) return Math.round((Number(h?.[1]||0)*60)+Number(m?.[1]||0)); const n=Number(text.replace(/[^0-9.]/g,'')); return Number.isFinite(n) ? Math.round(n) : 0; };
const createSleepEntry = () => ({ bedtime: '', wakeTime: '', hoursSlept: '', quality: '', recoveryNotes: '', sleep_start: '', wake_time: '', sleep_total: '', sleep_quality: '', sleep_notes: '' });
const minutesFromTime = (time) => { const match = String(time || '').match(/^(\d{1,2}):(\d{2})$/); if (!match) return null; const hours = Number(match[1]); const minutes = Number(match[2]); if (hours > 23 || minutes > 59) return null; return (hours * 60) + minutes; };
const calculateSleepMinutes = (start, wake) => { const startMinutes = minutesFromTime(start); const wakeMinutes = minutesFromTime(wake); if (startMinutes === null || wakeMinutes === null) return null; let total = wakeMinutes - startMinutes; if (total < 0) total += 24 * 60; return total; };
const formatSleepTotal = (minutes) => { if (!Number.isFinite(minutes) || minutes <= 0) return ''; const hours = Math.floor(minutes / 60); const mins = minutes % 60; return `${hours}h ${String(mins).padStart(2, '0')}m`; };
const sleepHoursValue = (minutes) => (Number.isFinite(minutes) && minutes > 0 ? (minutes / 60).toFixed(2) : '');
const sleepMinutesFromEntry = (sleep = {}) => calculateSleepMinutes(sleep.sleep_start || sleep.bedtime, sleep.wake_time || sleep.wakeTime);
const normalizeSleepEntry = (sleep = {}) => {
  const sleep_start = String(sleep.sleep_start ?? sleep.sleepStart ?? sleep.bedtime ?? '');
  const wake_time = String(sleep.wake_time ?? sleep.wakeTime ?? '');
  const totalMinutes = calculateSleepMinutes(sleep_start, wake_time);
  const sleep_total = formatSleepTotal(totalMinutes);
  const sleep_quality = String(sleep.sleep_quality ?? sleep.quality ?? '');
  const sleep_notes = String(sleep.sleep_notes ?? sleep.recoveryNotes ?? '');

  return {
    bedtime: sleep_start,
    wakeTime: wake_time,
    hoursSlept: sleepHoursValue(totalMinutes),
    quality: sleep_quality,
    recoveryNotes: sleep_notes,
    sleep_start,
    wake_time,
    sleep_total,
    sleep_quality,
    sleep_notes
  };
};

const initialState = { control: { gymLocation: 'CHAOTICA', arrivalTime: '', workoutLength: '', seasonPhase: '', sorenessRecovery: '', prepStatus: '' }, exerciseRows: Array.from({ length: EXERCISE_COUNT }, createExerciseRow), core: { focus: '', circuit: '', rounds: '', repScheme: '', format: 'BODYWEIGHT', completed: '' }, cardio: { type: '', duration: '', intensity: '', location: '', notes: '', weeklyGoal: '3 SESSIONS / 60 MIN', weeklyDone: '' }, vault: { compound: '', ester: '', amount: '', shotCurrent: '', shotTotal: '', sensitivity: '', cycleWeekCurrent: '', cycleWeekTotal: '' }, body: Object.fromEntries(bodyRows.map(([k]) => [k, { today: '', lastWeek: '', change: '' }])), bodyNotes: '', stageCall: { months: '', days: '', hours: '', minutes: '', seconds: '', stageDescription: '', posingMinutes: '', mandatoryRoundPracticed: '', strongestPose: '', weakestPose: '', transitions: '', posingFatigue: '', coachSelfNotes: '' }, soHowYouDoin: optionRegistry.thiccFitt.soHowYouDoin[0], soHowYouDoinNotes: '', photo: { progressPhotoRef: '', gymPhotoRef: '' }, weeklyTrackers: { weekStart: getWeekStartKey(), byDay: Object.fromEntries(WEEK_DAYS.map((d) => [d, { training: { gymMinutes: 0, cardioMinutes: 0 }, caffeineMg: '', sleep: createSleepEntry() }])) }, sessionCompleted: '' };

export default function ThiccFittSection() {
  const seasonOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittSeason);
  const sorenessOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittSoreness);
  const workoutDurationOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittWorkoutDuration);
  const prepStatusOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittPrepStatus);
  const compoundOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittCompound);
  const esterOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittEster);
  const amountCcOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittAmountCc);
  const amountMgOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittAmountMg);
  const cardioTypeOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittCardioType);
  const cardioDurationOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittCardioDuration);
  const cardioIntensityOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittCardioIntensity);
  const sleepQualityOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittSleepQuality);
  const soHowOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittSoHowYouDoin);
  const quoteOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittWarCryQuotes);
  const exerciseOptions = useClockItOptions(CLOCK_IT_KEYS.thiccFittExerciseLibrary);
  const exerciseWeightOptions = useClockItNumericOptions(CLOCK_IT_KEYS.exerciseWeight);
  const exerciseRepOptions = useClockItNumericOptions(CLOCK_IT_KEYS.exerciseReps);
  const exerciseSetOptions = useClockItNumericOptions(CLOCK_IT_KEYS.exerciseSets);
  const exerciseRestOptions = useClockItNumericOptions(CLOCK_IT_KEYS.exerciseRestSeconds);
  const [state, setState] = useState(initialState);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [dailyQuote, setDailyQuote] = useState(optionRegistry.thiccFitt.quoteOfDay[0]);
  const todayDay = WEEK_DAYS[new Date().getDay()];
  const todaySleep = normalizeSleepEntry(state.weeklyTrackers.byDay[todayDay]?.sleep || {});
  const dailySleepMinutes = calculateSleepMinutes(todaySleep.sleep_start, todaySleep.wake_time);
  const dailySleepSignal = {
    sleep_start: todaySleep.sleep_start,
    wake_time: todaySleep.wake_time,
    sleep_total: formatSleepTotal(dailySleepMinutes),
    sleep_quality: todaySleep.sleep_quality,
    sleep_notes: todaySleep.sleep_notes
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const safe = {
          ...parsed,
          exerciseRows: normalizeExerciseRows(parsed.exerciseRows),
          core: { ...initialState.core, ...(parsed.core || {}) },
          cardio: { ...initialState.cardio, ...(parsed.cardio || {}), weeklyDone: String(parsed?.cardio?.weeklyDone ?? '') },
          photo: { ...initialState.photo, ...(parsed.photo || {}), progressPhotoRef: parsed?.photo?.progressPhotoRef ?? '', gymPhotoRef: parsed?.photo?.gymPhotoRef ?? '' },
          soHowYouDoinNotes: String(parsed.soHowYouDoinNotes ?? ''),
          body: bodyRows.reduce((acc, [k]) => ({ ...acc, [k]: { today: String(parsed?.body?.[k]?.today ?? ''), lastWeek: String(parsed?.body?.[k]?.lastWeek ?? ''), change: String(parsed?.body?.[k]?.change ?? '') } }), {}),
          weeklyTrackers: {
            weekStart: (parsed?.weeklyTrackers?.weekStart === getWeekStartKey() ? parsed?.weeklyTrackers?.weekStart : getWeekStartKey()),
            byDay: Object.fromEntries(WEEK_DAYS.map((day) => [day, {
              training: {
                gymMinutes: Number(parsed?.weeklyTrackers?.byDay?.[day]?.training?.gymMinutes ?? 0),
                cardioMinutes: Number(parsed?.weeklyTrackers?.byDay?.[day]?.training?.cardioMinutes ?? 0)
              },
              caffeineMg: String(parsed?.weeklyTrackers?.byDay?.[day]?.caffeineMg ?? ''),
              sleep: normalizeSleepEntry({
                ...(parsed?.weeklyTrackers?.byDay?.[day]?.sleep || {}),
                ...(day === todayDay ? (parsed?.dailySleep || parsed?.sleepSignal || {}) : {})
              })
            }]))
          }
        };
        setState((p) => ({ ...p, ...safe }));
      }
    } catch {
      // keep default state
    } finally {
      setStorageHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (!storageHydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, date: todayKey(), dailySleep: dailySleepSignal }));
  }, [state, dailySleepSignal, storageHydrated]);

  useEffect(() => {
    const currentWeek = getWeekStartKey();
    if (state.weeklyTrackers.weekStart !== currentWeek) {
      setState((p) => ({ ...p, weeklyTrackers: initialState.weeklyTrackers }));
    }
  }, [state.weeklyTrackers.weekStart]);

  useEffect(() => {
    const gymMinutes = parseDurationMinutes(state.control.workoutLength);
    const cardioMinutes = parseDurationMinutes(state.cardio.duration);
    setState((p) => {
      const currentDayTraining = p.weeklyTrackers.byDay[todayDay]?.training || { gymMinutes: 0, cardioMinutes: 0 };
      if (currentDayTraining.gymMinutes === gymMinutes && currentDayTraining.cardioMinutes === cardioMinutes) return p;
      return {
        ...p,
        weeklyTrackers: {
          ...p.weeklyTrackers,
          byDay: {
            ...p.weeklyTrackers.byDay,
            [todayDay]: {
              ...p.weeklyTrackers.byDay[todayDay],
              training: { gymMinutes, cardioMinutes }
            }
          }
        }
      };
    });
  }, [state.control.workoutLength, state.cardio.duration]);

  useEffect(() => {
    const quoteBank = quoteOptions.filter((q) => q.verified && q.author && q.source);
    if (!quoteBank.length) return;
    const key = todayKey();
    const raw = localStorage.getItem(QUOTE_HISTORY_KEY);
    let history = { quoteByDate: {}, usedQuoteIds: [], cycle: 1, lastQuoteId: '' };
    try {
      const parsedHistory = raw ? JSON.parse(raw) : history;
      history = {
        quoteByDate: parsedHistory?.quoteByDate && typeof parsedHistory.quoteByDate === 'object' ? parsedHistory.quoteByDate : {},
        usedQuoteIds: Array.isArray(parsedHistory?.usedQuoteIds) ? parsedHistory.usedQuoteIds : [],
        cycle: Number(parsedHistory?.cycle || 1),
        lastQuoteId: String(parsedHistory?.lastQuoteId || '')
      };
    } catch {
      history = { quoteByDate: {}, usedQuoteIds: [], cycle: 1, lastQuoteId: '' };
    }
    const todayId = history.quoteByDate[key];
    if (todayId) {
      setDailyQuote(quoteBank.find((q) => q.id === todayId) || quoteBank[0]);
      return;
    }
    let pool = quoteBank.filter((q) => !history.usedQuoteIds.includes(q.id) && q.id !== history.lastQuoteId);
    if (!pool.length) {
      history.usedQuoteIds = [];
      history.cycle += 1;
      pool = quoteBank.filter((q) => q.id !== history.lastQuoteId);
    }
    const nextQuote = pool[Math.floor(Math.random() * pool.length)] || quoteBank[0];
    history.quoteByDate[key] = nextQuote.id;
    history.usedQuoteIds.push(nextQuote.id);
    history.lastQuoteId = nextQuote.id;
    localStorage.setItem(QUOTE_HISTORY_KEY, JSON.stringify(history));
    setDailyQuote(nextQuote);
  }, [quoteOptions]);

  useEffect(() => {
    if (!storageHydrated) return;
    publishThiccFittSessionProof({
      date: todayKey(), trainingTopValues: state.control, gym: state.control.gymLocation, arrival: state.control.arrivalTime, workoutLength: state.control.workoutLength, seasonPhase: state.control.seasonPhase, sorenessRecovery: state.control.sorenessRecovery, prepStatus: state.control.prepStatus, exerciseLogRows: state.exerciseRows, coreAbFinisher: state.core, cardio: state.cardio, bodyGrowthSummary: state.body, weeklyTrackers: state.weeklyTrackers, dailySleep: dailySleepSignal, sleepSignal: dailySleepSignal, sleep_start: dailySleepSignal.sleep_start, wake_time: dailySleepSignal.wake_time, sleep_total: dailySleepSignal.sleep_total, sleep_quality: dailySleepSignal.sleep_quality, sleep_notes: dailySleepSignal.sleep_notes, soHowYouDoinSelectedOption: state.soHowYouDoin, soHowYouDoinNotes: state.soHowYouDoinNotes, sessionPhoto: state.photo.progressPhotoRef, completed: state.sessionCompleted
    });
  }, [state, storageHydrated]);

  const update = (section, key, value) => setState((p) => ({ ...p, [section]: { ...p[section], [key]: value } }));
  const updateExercise = (i, key, value) => setState((p) => ({ ...p, exerciseRows: p.exerciseRows.map((r, n) => (i === n ? { ...r, [key]: value } : r)) }));
  const cardioComplianceLabel = useMemo(() => `${state.cardio.weeklyDone || '0'} / 3`, [state.cardio.weeklyDone]);
  const weeklyBattleRows = useMemo(() => WEEK_DAYS.map((day) => {
    const gymMinutes = Number(state.weeklyTrackers.byDay[day]?.training?.gymMinutes || 0);
    const cardioMinutes = Number(state.weeklyTrackers.byDay[day]?.training?.cardioMinutes || 0);
    const totalMinutes = gymMinutes + cardioMinutes;
    return { day, gymMinutes, cardioMinutes, totalMinutes, trained: totalMinutes > 0 };
  }), [state.weeklyTrackers.byDay]);
  const weeklyDaysTrained = weeklyBattleRows.filter((d) => d.trained).length;
  const weeklyTotalHours = (weeklyBattleRows.reduce((sum, row) => sum + row.totalMinutes, 0) / 60).toFixed(2);
  const caffeineTotal = WEEK_DAYS.reduce((sum, day) => sum + Number(state.weeklyTrackers.byDay[day].caffeineMg || 0), 0);
  const caffeineAvg = (caffeineTotal / 7).toFixed(1);
  const sleepWeeklyAvg = (WEEK_DAYS.reduce((sum, day) => sum + ((sleepMinutesFromEntry(state.weeklyTrackers.byDay[day].sleep) || 0) / 60), 0) / 7).toFixed(1);
  const updateWeeklyDay = (day, key, value) => setState((p) => ({ ...p, weeklyTrackers: { ...p.weeklyTrackers, byDay: { ...p.weeklyTrackers.byDay, [day]: { ...p.weeklyTrackers.byDay[day], [key]: value } } } }));
  const updateSleepDay = (day, key, value) => setState((p) => {
    const previousSleep = normalizeSleepEntry(p.weeklyTrackers.byDay[day].sleep);
    const aliases = { bedtime: 'sleep_start', wakeTime: 'wake_time', quality: 'sleep_quality', recoveryNotes: 'sleep_notes' };
    const nextSleep = { ...previousSleep, [key]: value, [aliases[key] || key]: value };
    if (key === 'sleep_start') nextSleep.bedtime = value;
    if (key === 'wake_time') nextSleep.wakeTime = value;
    if (key === 'sleep_quality') nextSleep.quality = value;
    if (key === 'sleep_notes') nextSleep.recoveryNotes = value;

    const totalMinutes = calculateSleepMinutes(nextSleep.sleep_start, nextSleep.wake_time);
    nextSleep.sleep_total = formatSleepTotal(totalMinutes);
    nextSleep.hoursSlept = sleepHoursValue(totalMinutes);

    return { ...p, weeklyTrackers: { ...p.weeklyTrackers, byDay: { ...p.weeklyTrackers.byDay, [day]: { ...p.weeklyTrackers.byDay[day], sleep: nextSleep } } } };
  });
  const fileInputRefs = useRef({});
  const mediaLibraryApi = typeof window !== 'undefined' ? (window.media_library || window.mediaLibrary || window.MediaLibrary || null) : null;
  const hasNativePicker = typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function';

  const photoSlots = [
    { key: 'progressPhotoRef', title: 'PROGRESS PHOTO' },
    { key: 'gymPhotoRef', title: 'GYM PHOTO' }
  ];

  const getPhotoLabel = (photoRef) => {
    if (!photoRef) return '';
    if (typeof photoRef === 'string') return photoRef;
    return photoRef.name || photoRef.id || photoRef.handleName || 'MEDIA REFERENCE SAVED';
  };

  const updatePhotoRef = (slotKey, nextRef) => setState((p) => ({
    ...p,
    photo: { ...p.photo, [slotKey]: nextRef }
  }));

  const pickPhotoFromLibrary = async (slotKey) => {
    try {
      if (mediaLibraryApi?.pick) {
        const picked = await mediaLibraryApi.pick({ type: 'image' });
        if (!picked) return;
        updatePhotoRef(slotKey, picked);
        return;
      }
      if (hasNativePicker) {
        const [handle] = await window.showOpenFilePicker({ multiple: false, types: [{ description: 'Images', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] } }] });
        if (!handle) return;
        updatePhotoRef(slotKey, { source: 'native_library_picker', name: handle.name || `${slotKey}_image`, kind: handle.kind || 'file', handleName: handle.name || '' });
        return;
      }
      if (fileInputRefs.current[slotKey]) {
        fileInputRefs.current[slotKey].click();
      }
    } catch (error) {
      console.warn('THICC.FITT photo pick failed', error);
    }
  };



  const handleFileFallback = async (slotKey, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await uploadPrivateImage(file, { context: 'thicc-fitt', sourceDate: todayKey() });
      updatePhotoRef(slotKey, uploaded.url);
    } catch (error) {
      console.warn('THICC.FITT photo upload failed', error);
    }
  };

  const shelves = [
    { id: 'A', columns: 1, className: 'tf30-shelf-a', panels: [{ id: 'entry-gate', token: 'compact', className: 'tf30-training-panel', content: <><h2>IN THE BEGINNING...</h2><div className="tf30-grid-2"><label>GYM<input value={state.control.gymLocation} onChange={(e) => update('control', 'gymLocation', e.target.value)} /></label><label>ARRIVAL<input type="time" value={state.control.arrivalTime} onChange={(e) => update('control', 'arrivalTime', e.target.value)} /></label><label>SEASON / PHASE<select value={state.control.seasonPhase} onChange={(e) => update('control', 'seasonPhase', e.target.value)}><option value="">--</option>{seasonOptions.map((o) => <option key={o}>{o}</option>)}</select></label><label>SORENESS LEVEL<select value={state.control.sorenessRecovery} onChange={(e) => update('control', 'sorenessRecovery', e.target.value)}><option value="">--</option>{sorenessOptions.map((o) => <option key={o}>{o}</option>)}</select></label><label>WORKOUT LENGTH<select value={state.control.workoutLength} onChange={(e) => update('control', 'workoutLength', e.target.value)}><option value="">--</option>{workoutDurationOptions.map((o) => <option key={o}>{o}</option>)}</select></label><label>PREP STATUS<select value={state.control.prepStatus} onChange={(e) => update('control', 'prepStatus', e.target.value)}><option value="">--</option>{prepStatusOptions.map((o) => <option key={o}>{o}</option>)}</select></label></div></> }] },
    { id: 'B', columns: 1, className: 'tf30-shelf-b', panels: [{ id: 'iron-ledger', token: 'tall', content: <><h2>IRON.LEDGER</h2><div className="tf30-table-head"><span>#</span><span>EXERCISE</span><span>WEIGHT</span><span>REPS</span><span>SETS</span><span>FAILURE</span><span>REST</span></div>{state.exerciseRows.map((r, i) => <div className="tf30-table-row" key={i}><span>{i + 1}</span><select value={r.exercise} onChange={(e) => updateExercise(i, 'exercise', e.target.value)}><option value="">SELECT</option>{exerciseOptions.map((o)=><option key={o}>{o}</option>)}</select><select value={r.weight} onChange={(e) => updateExercise(i, 'weight', e.target.value)}><option value="">--</option>{exerciseWeightOptions.map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}</select><select value={r.reps} onChange={(e) => updateExercise(i, 'reps', e.target.value)}><option value="">--</option>{exerciseRepOptions.map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}</select><select value={r.sets} onChange={(e) => updateExercise(i, 'sets', e.target.value)}><option value="">--</option>{exerciseSetOptions.map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}</select><select value={r.failure || 'N'} onChange={(e) => updateExercise(i, 'failure', e.target.value)}><option>Y</option><option>N</option></select><select value={r.rest || ''} onChange={(e) => updateExercise(i, 'rest', e.target.value)}><option value="">--</option>{exerciseRestOptions.map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>)}</> }] },
    { id: 'C', columns: 2, className: 'tf30-shelf-c', panels: [{ id: 'da-vault', token: 'medium', content: <><h2>DA.VAULT</h2><label>COMPOUND<select value={state.vault.compound} onChange={(e) => update('vault', 'compound', e.target.value)}><option value="">--</option>{compoundOptions.map((o) => <option key={o}>{o}</option>)}</select></label><label>ESTER / FORM<select value={state.vault.ester} onChange={(e) => update('vault', 'ester', e.target.value)}><option value="">--</option>{esterOptions.map((o) => <option key={o}>{o}</option>)}</select></label><label>AMOUNT<select value={state.vault.amount} onChange={(e) => update('vault', 'amount', e.target.value)}><option value="">--</option><optgroup label="CC">{amountCcOptions.map((o) => <option key={o}>{o}</option>)}</optgroup><optgroup label="MG">{amountMgOptions.map((o) => <option key={o}>{o}</option>)}</optgroup></select></label></> }, { id: 'war-cry', token: 'compact', className: 'tf30-quote-panel', content: <><h2>THE WAR CRY</h2><div className="tf30-war-cry-frame"><blockquote>{dailyQuote?.text}</blockquote><div className="tf30-quote-meta">— {dailyQuote?.author} · {dailyQuote?.source}</div></div></> }] },
    { id: 'D', columns: 2, panels: [{ id: 'chase', token: 'medium', content: <><h2>THE CHASE</h2><div className="tf30-cardio-grid"><label>CARDIO TYPE<select value={state.cardio.type} onChange={(e) => update('cardio', 'type', e.target.value)}><option value="">--</option>{cardioTypeOptions.map((o) => <option key={o}>{o}</option>)}</select></label><label>CARDIO DURATION<select value={state.cardio.duration} onChange={(e) => update('cardio', 'duration', e.target.value)}><option value="">--</option>{cardioDurationOptions.map((o) => <option key={o}>{o}</option>)}</select></label><label>CARDIO INTENSITY<select value={state.cardio.intensity} onChange={(e) => update('cardio', 'intensity', e.target.value)}><option value="">--</option>{cardioIntensityOptions.map((o) => <option key={o}>{o}</option>)}</select></label><label>LOCATION<input value={state.cardio.location} onChange={(e) => update('cardio', 'location', e.target.value)} /></label><label className="tf30-span-2">NOTES<textarea value={state.cardio.notes} onChange={(e) => update('cardio', 'notes', e.target.value)} /></label><label>WEEKLY CARDIO GOAL<input value={state.cardio.weeklyGoal} onChange={(e) => update('cardio', 'weeklyGoal', e.target.value)} /></label><label>WEEKLY PROGRESS<input value={state.cardio.weeklyDone} onChange={(e) => update('cardio', 'weeklyDone', e.target.value)} placeholder={cardioComplianceLabel} /></label></div></> }, { id: 'body-receipts', token: 'medium', content: <><h2>BODY RECEIPTS</h2><h3>MEASUREMENTS / RECEIPTS</h3><div className="tf30-metric-header"><span>METRIC</span><span>TODAY</span><span>LAST WEEK</span><span>CHANGE</span></div>{bodyRows.map(([k, l]) => <div className="tf30-metric-row" key={k}><span>{l}</span><input value={state.body[k].today} onChange={(e) => setState((p) => ({ ...p, body: { ...p.body, [k]: { ...p.body[k], today: e.target.value } } }))} /><input value={state.body[k].lastWeek} onChange={(e) => setState((p) => ({ ...p, body: { ...p.body, [k]: { ...p.body[k], lastWeek: e.target.value } } }))} /><input value={state.body[k].change} onChange={(e) => setState((p) => ({ ...p, body: { ...p.body, [k]: { ...p.body[k], change: e.target.value } } }))} /></div>)}<label>NOTES<textarea value={state.bodyNotes} onChange={(e) => setState((p) => ({ ...p, bodyNotes: e.target.value }))} /></label></> }] },
    { id: 'E', columns: 1, panels: [{ id: 'caffeine-tally', token: 'compact', className: 'tf30-upup-panel', content: <><h2>UPUP JUICE TRACKER</h2><div className="tf30-upup-rack">{WEEK_DAYS.map((day) => <label key={day} className="tf30-upup-vial"><span>{day}</span><input value={state.weeklyTrackers.byDay[day].caffeineMg} onChange={(e) => updateWeeklyDay(day, 'caffeineMg', e.target.value)} /><small>MG</small></label>)}</div><div className="tf30-weekly-summary tf30-upup-summary"><span>WEEKLY MG TOTAL: {caffeineTotal}</span><span>DAILY AVERAGE MG: {caffeineAvg}</span></div></> }] },
    { id: 'F', columns: 2, panels: [{ id: 'weekly-battle-tally', token: 'medium', content: <><h2>WEEKLY BATTLE TALLY</h2><div className="tf30-weekly-pull-label">PULLS FROM WORKOUT LENGTH + CARDIO DURATION</div><div className="tf30-weekly-list">{weeklyBattleRows.map((row) => <div key={row.day} className={`tf30-week-row ${row.trained ? 'is-trained' : 'is-rest'}`}><strong>{row.day}</strong><span className="tf30-week-status">{row.trained ? 'TRAINED' : 'REST'}</span><span>GYM {row.gymMinutes} MIN</span><span>CARDIO {row.cardioMinutes} MIN</span><span>TOTAL {row.totalMinutes} MIN</span></div>)}</div><div className="tf30-weekly-summary"><span>DAYS TRAINED: {weeklyDaysTrained}</span><span className="tf30-weekly-total-hours">TOTAL HOURS TRAINED: {weeklyTotalHours}</span></div></> }, { id: 'sleep-watch', token: 'compact', className: 'tf30-sleep-panel', content: <><h2>SLEEP WATCH</h2><div className="tf30-sleep-grid"><label>SLEEP START<input type="time" value={todaySleep.sleep_start} onChange={(e) => updateSleepDay(todayDay, 'sleep_start', e.target.value)} /></label><label>WAKE TIME<input type="time" value={todaySleep.wake_time} onChange={(e) => updateSleepDay(todayDay, 'wake_time', e.target.value)} /></label><div className="tf30-sleep-total-field"><span>TOTAL SLEEP</span><strong className="tf30-sleep-total-chip" aria-live="polite">{todaySleep.sleep_total || '—'}</strong></div><label>QUALITY<select value={todaySleep.sleep_quality} onChange={(e) => updateSleepDay(todayDay, 'sleep_quality', e.target.value)}><option value="">SELECT QUALITY</option>{sleepQualityOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label><label className="tf30-span-2">SLEEP NOTES<textarea value={todaySleep.sleep_notes} onChange={(e) => updateSleepDay(todayDay, 'sleep_notes', e.target.value)} placeholder="OPTIONAL SLEEP NOTE FOR THE DAILY SIGNAL" /></label></div><div className="tf30-weekly-summary tf30-sleep-summary"><span>WEEKLY SLEEP AVERAGE: {sleepWeeklyAvg}H</span><span>CLEAN DAILY SLEEP SIGNAL SAVED FOR ASSURER FEED</span></div></> }] },
    { id: 'G', columns: 1, panels: [{ id: 'proof-wall', token: 'compact', className: 'tf30-trophy-wall-panel', content: <><h2>THE TROPHY WALL</h2><div className="tf30-trophy-wall-grid">{photoSlots.map((slot) => { const photoRef = state.photo[slot.key]; return <div className="tf30-photo-spot" key={slot.key}><div className="tf30-photo-spot-title">{slot.title}</div>{photoRef ? <><div className="tf30-photo-ref">SELECTED: {getPhotoLabel(photoRef)}</div><div className="tf30-photo-actions"><button type="button" onClick={() => pickPhotoFromLibrary(slot.key)}>REPLACE</button><button type="button" onClick={() => updatePhotoRef(slot.key, '')}>REMOVE</button></div></> : <><div className="tf30-photo-empty">NO PHOTO SELECTED</div><button type="button" onClick={() => pickPhotoFromLibrary(slot.key)}>SELECT FROM LIBRARY</button></>}<input ref={(node) => { fileInputRefs.current[slot.key] = node; }} className="tf30-file-input" type="file" accept="image/*" onChange={(event) => handleFileFallback(slot.key, event)} /></div>; })}</div></> }] },
    { id: 'H', columns: 1, panels: [{ id: 'how-doin', token: 'medium', className: 'tf30-sohow-panel', content: <><h2>SO HOW YOU DOIN 🫪⁉️</h2><select value={state.soHowYouDoin} onChange={(e) => setState((p) => ({ ...p, soHowYouDoin: e.target.value }))}>{soHowOptions.map((o) => <option key={o}>{o}</option>)}</select><label>SESSION NOTES<textarea className="tf30-lined-notes" value={state.soHowYouDoinNotes} onChange={(e) => setState((p) => ({ ...p, soHowYouDoinNotes: e.target.value }))} /></label></> }] },
    { id: 'I', columns: 1, className: 'tf30-shelf-f', panels: [{ id: 'arena-rules', token: 'strip', content: <><h2>ARENA RULES</h2><div className="tf30-footer"><span>MIN 75 MIN</span><span>MAX 120 MIN</span><span>CORE 15 MIN</span><span>CARDIO 60 MIN / 3X WEEK</span><span>POSE DAILY. STAGE COMMAND</span><span>PROGRESS REMINDER</span></div></> }] }
  ];

  return <SectionShell className="tf30-shell thicc-fitt-page"><ScenePlate><div className="tf30-bg" /><div className="tf30-overlay" /></ScenePlate><SectionOverlay><ArtLane className="tf30-left" /><ContentScroller className="tf30-content"><BlueprintStack shelves={shelves} /></ContentScroller></SectionOverlay></SectionShell>;
}
