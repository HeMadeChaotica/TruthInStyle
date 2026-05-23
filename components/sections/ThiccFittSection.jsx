'use client';
import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/thicc-fitt.css';
import '../../styles/sections/universal-frame.css';
import { optionRegistry } from '../../lib/dropdowns/optionRegistry';
import { publishThiccFittSessionProof } from '../../src/services/assurerService';
import { ArtLane, BlueprintStack, ContentScroller, ScenePlate, SectionOverlay, SectionShell } from '../shared/UniversalSectionFrame';

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
const todayKey = () => new Date().toISOString().slice(0, 10);

const initialState = { control: { gymLocation: 'CHAOTICA', arrivalTime: '', workoutLength: '', seasonPhase: '', sorenessRecovery: '', prepStatus: '' }, exerciseRows: Array.from({ length: EXERCISE_COUNT }, createExerciseRow), core: { focus: '', circuit: '', rounds: '', repScheme: '', format: 'BODYWEIGHT', completed: '' }, cardio: { type: '', duration: '', intensity: '', location: '', notes: '', weeklyGoal: '3 SESSIONS / 60 MIN', weeklyDone: '' }, vault: { compound: '', ester: '', amount: '', shotCurrent: '', shotTotal: '', sensitivity: '', cycleWeekCurrent: '', cycleWeekTotal: '' }, body: Object.fromEntries(bodyRows.map(([k]) => [k, { today: '', lastWeek: '', change: '' }])), soHowYouDoin: optionRegistry.thiccFitt.soHowYouDoin[0], soHowYouDoinNotes: '', photo: { nextShoot: '', targetMonth: '', daysRemaining: '', submissionStatus: 'NOT SUBMITTED', lastSubmitted: '', history: '', featuredPhoto: '', featuredPhotoStamp: '' }, inbody: { lastScan: '', notes: '', history: '' }, sessionCompleted: '' };

export default function ThiccFittSection() {
  const [state, setState] = useState(initialState);
  const [dailyQuote, setDailyQuote] = useState(optionRegistry.thiccFitt.quoteOfDay[0]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const safe = {
        ...parsed,
        exerciseRows: normalizeExerciseRows(parsed.exerciseRows),
        core: { ...initialState.core, ...(parsed.core || {}) },
        cardio: { ...initialState.cardio, ...(parsed.cardio || {}), weeklyDone: String(parsed?.cardio?.weeklyDone ?? '') },
        photo: { ...initialState.photo, ...(parsed.photo || {}), featuredPhoto: String(parsed?.photo?.featuredPhoto ?? '') },
        inbody: { ...initialState.inbody, ...(parsed.inbody || {}) },
        soHowYouDoinNotes: String(parsed.soHowYouDoinNotes ?? ''),
        body: bodyRows.reduce((acc, [k]) => ({ ...acc, [k]: { today: String(parsed?.body?.[k]?.today ?? ''), lastWeek: String(parsed?.body?.[k]?.lastWeek ?? ''), change: String(parsed?.body?.[k]?.change ?? '') } }), {})
      };
      setState((p) => ({ ...p, ...safe }));
    } catch {
      // keep default state
    }
  }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);

  useEffect(() => {
    const quoteBank = optionRegistry.thiccFitt.quoteOfDay.filter((q) => q.verified && q.author && q.source);
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
  }, []);

  useEffect(() => {
    publishThiccFittSessionProof({
      date: todayKey(), trainingTopValues: state.control, gym: state.control.gymLocation, arrival: state.control.arrivalTime, workoutLength: state.control.workoutLength, seasonPhase: state.control.seasonPhase, sorenessRecovery: state.control.sorenessRecovery, prepStatus: state.control.prepStatus, exerciseLogRows: state.exerciseRows, coreAbFinisher: state.core, cardio: state.cardio, bodyGrowthSummary: state.body, inbodySnapshot: state.inbody, soHowYouDoinSelectedOption: state.soHowYouDoin, soHowYouDoinNotes: state.soHowYouDoinNotes, sessionPhoto: state.photo.featuredPhoto, completed: state.sessionCompleted
    });
  }, [state]);

  const update = (section, key, value) => setState((p) => ({ ...p, [section]: { ...p[section], [key]: value } }));
  const updateExercise = (i, key, value) => setState((p) => ({ ...p, exerciseRows: p.exerciseRows.map((r, n) => (i === n ? { ...r, [key]: value } : r)) }));
  const cardioComplianceLabel = useMemo(() => `${state.cardio.weeklyDone || '0'} / 3`, [state.cardio.weeklyDone]);
  const uploadFeaturedPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update('photo', 'featuredPhoto', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const shelves = [
    { id: 'A', columns: 2, className: 'tf30-shelf-a tf30-rhythm-compact', panels: [{ id: 'entry-gate', token: 'compact', className: 'tf30-training-panel', content: <><h2>IN THE BEGINNING...</h2><div className="tf30-grid-2"><label>GYM<input value={state.control.gymLocation} onChange={(e) => update('control', 'gymLocation', e.target.value)} /></label><label>ARRIVAL<input type="time" value={state.control.arrivalTime} onChange={(e) => update('control', 'arrivalTime', e.target.value)} /></label><label>SEASON / PHASE<select value={state.control.seasonPhase} onChange={(e) => update('control', 'seasonPhase', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.roidSeason.map((o) => <option key={o}>{o}</option>)}</select></label><label>SORENESS LEVEL<select value={state.control.sorenessRecovery} onChange={(e) => update('control', 'sorenessRecovery', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.sorenessLevel.map((o) => <option key={o}>{o}</option>)}</select></label><label>WORKOUT LENGTH<select value={state.control.workoutLength} onChange={(e) => update('control', 'workoutLength', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.roidWorkoutDuration.map((o) => <option key={o}>{o}</option>)}</select></label><label>PREP STATUS<select value={state.control.prepStatus} onChange={(e) => update('control', 'prepStatus', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.prepStatus.map((o) => <option key={o}>{o}</option>)}</select></label></div></> }] },
    { id: 'B', columns: 1, className: 'tf30-shelf-b tf30-rhythm-dominant', panels: [{ id: 'iron-ledger', token: 'tall', content: <><h2>IRON.LEDGER</h2><div className="tf30-table-head"><span>#</span><span>EXERCISE</span><span>WEIGHT</span><span>REPS</span><span>SETS</span><span>FAILURE</span><span>REST</span></div>{state.exerciseRows.map((r, i) => <div className="tf30-table-row" key={i}><span>{i + 1}</span><input value={r.exercise} onChange={(e) => updateExercise(i, 'exercise', e.target.value)} /><input value={r.weight} onChange={(e) => updateExercise(i, 'weight', e.target.value)} /><input value={r.reps} onChange={(e) => updateExercise(i, 'reps', e.target.value)} /><input value={r.sets} onChange={(e) => updateExercise(i, 'sets', e.target.value)} /><select value={r.failure || 'N'} onChange={(e) => updateExercise(i, 'failure', e.target.value)}><option>Y</option><option>N</option></select><input value={r.rest || ''} onChange={(e) => updateExercise(i, 'rest', e.target.value)} /></div>)}</> }] },
    { id: 'C', columns: 2, className: 'tf30-shelf-c tf30-rhythm-pair', panels: [{ id: 'da-vault', token: 'medium', content: <><h2>DA.VAULT</h2><label>COMPOUND<select value={state.vault.compound} onChange={(e) => update('vault', 'compound', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.roidCompound.map((o) => <option key={o}>{o}</option>)}</select></label><label>ESTER / FORM<select value={state.vault.ester} onChange={(e) => update('vault', 'ester', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.roidEster.map((o) => <option key={o}>{o}</option>)}</select></label><label>AMOUNT<select value={state.vault.amount} onChange={(e) => update('vault', 'amount', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.roidAmount.map((o) => <option key={o}>{o}</option>)}</select></label></> }, { id: 'war-cry', token: 'compact', className: 'tf30-quote-panel', content: <><h2>THE WAR CRY</h2><blockquote>{dailyQuote?.text}</blockquote><div className="tf30-quote-meta">— {dailyQuote?.author} · {dailyQuote?.source}</div><span className="tf30-quote-tag">{dailyQuote?.category}</span></> }] },
    { id: 'D', columns: 2, className: 'tf30-rhythm-pair', panels: [{ id: 'chase', token: 'medium', content: <><h2>THE CHASE</h2><div className="tf30-cardio-grid"><label>CARDIO TYPE<select value={state.cardio.type} onChange={(e) => update('cardio', 'type', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.roidCardioType.map((o) => <option key={o}>{o}</option>)}</select></label><label>CARDIO DURATION<select value={state.cardio.duration} onChange={(e) => update('cardio', 'duration', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.roidCardioDuration.map((o) => <option key={o}>{o}</option>)}</select></label><label>CARDIO INTENSITY<input value={state.cardio.intensity} onChange={(e) => update('cardio', 'intensity', e.target.value)} /></label><label>LOCATION<input value={state.cardio.location} onChange={(e) => update('cardio', 'location', e.target.value)} /></label><label className="tf30-span-2">NOTES<textarea value={state.cardio.notes} onChange={(e) => update('cardio', 'notes', e.target.value)} /></label><label>WEEKLY CARDIO GOAL<input value={state.cardio.weeklyGoal} onChange={(e) => update('cardio', 'weeklyGoal', e.target.value)} /></label><label>WEEKLY PROGRESS<input value={state.cardio.weeklyDone} onChange={(e) => update('cardio', 'weeklyDone', e.target.value)} placeholder={cardioComplianceLabel} /></label></div></> }, { id: 'body-receipts', token: 'medium', content: <><h2>BODY RECEIPTS</h2><h3>MEASUREMENTS / RECEIPTS</h3><div className="tf30-metric-header"><span>METRIC</span><span>TODAY</span><span>LAST WEEK</span><span>CHANGE</span></div>{bodyRows.map(([k, l]) => <div className="tf30-metric-row" key={k}><span>{l}</span><input value={state.body[k].today} onChange={(e) => setState((p) => ({ ...p, body: { ...p.body, [k]: { ...p.body[k], today: e.target.value } } }))} /><input value={state.body[k].lastWeek} onChange={(e) => setState((p) => ({ ...p, body: { ...p.body, [k]: { ...p.body[k], lastWeek: e.target.value } } }))} /><input value={state.body[k].change} onChange={(e) => setState((p) => ({ ...p, body: { ...p.body, [k]: { ...p.body[k], change: e.target.value } } }))} /></div>)}<div className="tf30-scan-subsection"><h3>THE SCAN</h3><div className="tf30-inbody-grid"><label>LAST SCAN<input value={state.inbody.lastScan} onChange={(e) => update('inbody', 'lastScan', e.target.value)} /></label><label className="tf30-span-2">SPIKES / NOTES<textarea value={state.inbody.notes} onChange={(e) => update('inbody', 'notes', e.target.value)} /></label><button type="button" className="tf30-history-btn" onClick={() => update('inbody', 'history', `${new Date().toLocaleDateString()} checked`)}>VIEW HISTORY</button></div></div></> }] },
    { id: 'E', columns: 1, className: 'tf30-rhythm-breathing', panels: [{ id: 'how-doin', token: 'tall', className: 'tf30-sohow-panel', content: <><h2>SO HOW YOU DOIN 🫪⁉️</h2><select value={state.soHowYouDoin} onChange={(e) => setState((p) => ({ ...p, soHowYouDoin: e.target.value }))}>{optionRegistry.thiccFitt.soHowYouDoin.map((o) => <option key={o}>{o}</option>)}</select><label>SESSION NOTES<textarea className="tf30-lined-notes" value={state.soHowYouDoinNotes} onChange={(e) => setState((p) => ({ ...p, soHowYouDoinNotes: e.target.value }))} /></label></> }] },
    { id: 'F', columns: 1, panels: [{ id: 'countdown', token: 'compact', content: <><h2>THE COUNTDOWN</h2><label>NEXT SHOOT<input value={state.photo.nextShoot} onChange={(e) => update('photo', 'nextShoot', e.target.value)} /></label><label>TARGET MONTH / LAST SATURDAY<input value={state.photo.targetMonth} onChange={(e) => update('photo', 'targetMonth', e.target.value)} /></label><label>DAYS REMAINING<input value={state.photo.daysRemaining} onChange={(e) => update('photo', 'daysRemaining', e.target.value)} /></label><label>SUBMISSION STATUS<input value={state.photo.submissionStatus} onChange={(e) => update('photo', 'submissionStatus', e.target.value)} /></label><label>LAST SUBMITTED<input value={state.photo.lastSubmitted} onChange={(e) => update('photo', 'lastSubmitted', e.target.value)} /></label><label>CHECKPOINT HISTORY<textarea value={state.photo.history} onChange={(e) => update('photo', 'history', e.target.value)} /></label></> }] },
    { id: 'G', columns: 1, panels: [{ id: 'proof-wall', token: 'compact', content: <><h2>PROOF WALL</h2><label className="tf30-featured-photo">{state.photo.featuredPhoto ? <img src={state.photo.featuredPhoto} alt="ITS GIVIN THICC session" /> : 'FEATURED SESSION PHOTO'}<input className="tf30-file-input" type="file" accept="image/*" onChange={uploadFeaturedPhoto} /></label></> }] },
    { id: 'H', columns: 1, className: 'tf30-shelf-f', panels: [{ id: 'arena-rules', token: 'strip', content: <><h2>ARENA RULES</h2><div className="tf30-footer"><span>MIN 75 MIN</span><span>MAX 120 MIN</span><span>CORE 15 MIN</span><span>CARDIO 60 MIN / 3X WEEK</span><span>INBODY WEEKLY SATURDAY</span><span>PROGRESS REMINDER</span></div></> }] }
  ];

  return <SectionShell className="tf30-shell thicc-fitt-page"><ScenePlate><div className="tf30-bg" /><div className="tf30-overlay" /></ScenePlate><SectionOverlay><ArtLane className="tf30-left" /><ContentScroller className="tf30-content"><BlueprintStack shelves={shelves} /></ContentScroller></SectionOverlay></SectionShell>;
}
