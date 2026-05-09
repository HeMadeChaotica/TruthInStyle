'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/thicc-fitt.css';
import { optionRegistry } from '../../lib/dropdowns/optionRegistry';

const STORAGE_KEY = 'thicc_fitt_day';

const EXERCISE_COUNT = 6;
const initialExercise = { exercise: '', weight: '', reps: '', sets: '', failure: 'N', notes: '' };

const measurementFields = [
  ['weight', 'WEIGHT'], ['bodyFat', 'BODY FAT %'], ['chest', 'CHEST'], ['waist', 'WAIST'], ['hips', 'HIPS'],
  ['armsL', 'ARMS L'], ['armsR', 'ARMS R'], ['thighsL', 'THIGHS L'], ['thighsR', 'THIGHS R'], ['glutes', 'GLUTES']
];

const initialState = {
  control: { gymLocation: '', arrivalTime: '', workoutLength: '', seasonPhase: '', sorenessRecovery: '', prepStatus: '' },
  exerciseRows: Array.from({ length: EXERCISE_COUNT }, () => ({ ...initialExercise })),
  coreFocus: '',
  coreMinutes: '15',
  trainingDuration: '',
  sessionTotal: '',
  sessionCompleted: false,
  cardio: { type: '', duration: '', intensity: '', location: '', notes: '', weeklyDone: 0 },
  soHowYouDoin: optionRegistry.thiccFitt.soHowYouDoin[0],
  soHowYouDoinNotes: '',
  body: Object.fromEntries(measurementFields.map(([k]) => [k, ''])),
  bodyNotes: '',
  inbodyLastScan: '',
  inbodyWoW: '',
  inbodyWatchItems: '',
  vault: { compound: '', ester: '', amount: '', shotCurrent: '', shotTotal: '', sensitivity: '', cycleWeekCurrent: '', cycleWeekTotal: '' },
  quoteOfDay: optionRegistry.thiccFitt.quoteOfDay[0],
  photo: { nextShoot: '', daysRemaining: '', submissionStatus: 'NOT SUBMITTED', lastSubmitted: '', targetMonth: '' }
};

export default function ThiccFittSection() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setState((prev) => ({ ...prev, ...JSON.parse(raw) }));
  }, []);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const update = (section, key, value) => setState((p) => ({ ...p, [section]: { ...p[section], [key]: value } }));
  const updateExercise = (idx, key, value) => setState((p) => ({ ...p, exerciseRows: p.exerciseRows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)) }));

  const cardioComplianceLabel = useMemo(() => `${state.cardio.weeklyDone} / 3`, [state.cardio.weeklyDone]);

  return (
    <section className="tf30-shell">
      <div className="tf30-bg" />
      <aside className="tf30-left">
        <div className="tf30-left-fade" />
        <Link href="/its-getting-thicc" className="tf30-crystal" aria-label="CRYSTAL DUMBBELL ACCESS">
          <img src="/ui/glyphs/triggers/glyph-crystal-dumbbell.png" alt="CRYSTAL DUMBBELL" />
          <span>CLIENT SYSTEM ACCESS</span>
        </Link>
      </aside>

      <section className="tf30-right">
        <header className="tf30-panel tf30-band">
          <h1>THICC.FITT</h1>
          <div><label>GYM</label><input value={state.control.gymLocation} onChange={(e) => update('control', 'gymLocation', e.target.value)} /></div>
          <div><label>ARRIVAL</label><input type="time" value={state.control.arrivalTime} onChange={(e) => update('control', 'arrivalTime', e.target.value)} /></div>
          <div><label>WORKOUT LENGTH</label><select value={state.control.workoutLength} onChange={(e) => update('control', 'workoutLength', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.roidWorkoutDuration.map((o) => <option key={o}>{o}</option>)}</select></div>
          <div><label>SEASON / PHASE</label><select value={state.control.seasonPhase} onChange={(e) => update('control', 'seasonPhase', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.roidSeason.map((o) => <option key={o}>{o}</option>)}</select></div>
          <div><label>SORENESS / RECOVERY</label><input value={state.control.sorenessRecovery} onChange={(e) => update('control', 'sorenessRecovery', e.target.value)} /></div>
          <div><label>PREP STATUS</label><input value={state.control.prepStatus} onChange={(e) => update('control', 'prepStatus', e.target.value)} /></div>
          <Link href="/clock-it" className="tf30-clock">CLOCK.IT</Link>
        </header>

        <main className="tf30-grid">
          <section className="tf30-panel tf30-exercise"><h2>EXERCISE LOG 2.0</h2><p>6 EXERCISES PER SESSION · CORE 15 MIN · SESSION 75-120 MIN</p>
            <div className="tf30-table-head"><span>#</span><span>EXERCISE</span><span>WEIGHT</span><span>REPS</span><span>SETS</span><span>FAILURE</span><span>NOTES</span></div>
            {state.exerciseRows.map((row, i) => <div className="tf30-table-row" key={i}><span>{i + 1}</span><input value={row.exercise} onChange={(e) => updateExercise(i, 'exercise', e.target.value)} /><input value={row.weight} onChange={(e) => updateExercise(i, 'weight', e.target.value)} /><input value={row.reps} onChange={(e) => updateExercise(i, 'reps', e.target.value)} /><input value={row.sets} onChange={(e) => updateExercise(i, 'sets', e.target.value)} /><select value={row.failure} onChange={(e) => updateExercise(i, 'failure', e.target.value)}><option>Y</option><option>N</option></select><input value={row.notes} onChange={(e) => updateExercise(i, 'notes', e.target.value)} /></div>)}
            <div className="tf30-core"><strong>CORE WORK (15 MINUTES)</strong><input placeholder="CORE FOCUS" value={state.coreFocus} onChange={(e) => setState((p) => ({ ...p, coreFocus: e.target.value }))} /><input value={state.coreMinutes} onChange={(e) => setState((p) => ({ ...p, coreMinutes: e.target.value }))} /></div>
            <div className="tf30-duration"><label>TRAINING DURATION<input value={state.trainingDuration} onChange={(e) => setState((p) => ({ ...p, trainingDuration: e.target.value }))} /></label><label>SESSION TOTAL<input value={state.sessionTotal} onChange={(e) => setState((p) => ({ ...p, sessionTotal: e.target.value }))} /></label><label>COMPLETED<input type="checkbox" checked={state.sessionCompleted} onChange={(e) => setState((p) => ({ ...p, sessionCompleted: e.target.checked }))} /></label></div>
          </section>

          <section className="tf30-panel tf30-vault"><h2>VAULT 2.0</h2><label>COMPOUND<select value={state.vault.compound} onChange={(e) => update('vault', 'compound', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.roidCompound.map((o) => <option key={o}>{o}</option>)}</select></label><label>ESTER / FORM<select value={state.vault.ester} onChange={(e) => update('vault', 'ester', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.roidEster.map((o) => <option key={o}>{o}</option>)}</select></label><label>AMOUNT<select value={state.vault.amount} onChange={(e) => update('vault', 'amount', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.roidAmount.map((o) => <option key={o}>{o}</option>)}</select></label><label>SHOT __ OF __<div><input value={state.vault.shotCurrent} onChange={(e) => update('vault', 'shotCurrent', e.target.value)} /><input value={state.vault.shotTotal} onChange={(e) => update('vault', 'shotTotal', e.target.value)} /></div></label><label>SENSITIVITY<select value={state.vault.sensitivity} onChange={(e) => update('vault', 'sensitivity', e.target.value)}><option value="">--</option>{optionRegistry.thiccFitt.roidSensitivity.map((o) => <option key={o}>{o}</option>)}</select></label><label>CYCLE WEEK __ OF __<div><input value={state.vault.cycleWeekCurrent} onChange={(e) => update('vault', 'cycleWeekCurrent', e.target.value)} /><input value={state.vault.cycleWeekTotal} onChange={(e) => update('vault', 'cycleWeekTotal', e.target.value)} /></div></label></section>

          <section className="tf30-panel"><h2>CARDIO / CONDITIONING</h2><div className="tf30-split"><select value={state.cardio.type} onChange={(e) => update('cardio', 'type', e.target.value)}><option value="">CARDIO TYPE</option>{optionRegistry.thiccFitt.roidCardioType.map((o) => <option key={o}>{o}</option>)}</select><select value={state.cardio.duration} onChange={(e) => update('cardio', 'duration', e.target.value)}><option value="">CARDIO DURATION</option>{optionRegistry.thiccFitt.roidCardioDuration.map((o) => <option key={o}>{o}</option>)}</select><select value={state.cardio.intensity} onChange={(e) => update('cardio', 'intensity', e.target.value)}><option value="">CARDIO INTENSITY</option><option>LOW</option><option>MODERATE</option><option>HIGH</option><option>MAX</option></select><input placeholder="CARDIO LOCATION" value={state.cardio.location} onChange={(e) => update('cardio', 'location', e.target.value)} /><textarea placeholder="CARDIO NOTES" value={state.cardio.notes} onChange={(e) => update('cardio', 'notes', e.target.value)} /><label>WEEKLY COMPLIANCE (3X/WEEK)<input type="number" min="0" max="3" value={state.cardio.weeklyDone} onChange={(e) => update('cardio', 'weeklyDone', Number(e.target.value) || 0)} /><span>{cardioComplianceLabel}</span></label></div></section>

          <section className="tf30-panel"><h2>SO HOW YOU DOIN 🫪⁉️</h2><select value={state.soHowYouDoin} onChange={(e) => setState((p) => ({ ...p, soHowYouDoin: e.target.value }))}>{optionRegistry.thiccFitt.soHowYouDoin.map((o) => <option key={o}>{o}</option>)}</select><textarea value={state.soHowYouDoinNotes} onChange={(e) => setState((p) => ({ ...p, soHowYouDoinNotes: e.target.value }))} placeholder="NOTES" /></section>

          <section className="tf30-panel"><h2>BODY / GROWTH TRACKING</h2><div className="tf30-metrics">{measurementFields.map(([k, l]) => <label key={k}>{l}<input value={state.body[k]} onChange={(e) => setState((p) => ({ ...p, body: { ...p.body, [k]: e.target.value } }))} /></label>)}</div><textarea placeholder="NOTES" value={state.bodyNotes} onChange={(e) => setState((p) => ({ ...p, bodyNotes: e.target.value }))} /><div className="tf30-week"><strong>INBODY SATURDAY</strong><input placeholder="LAST SCAN" value={state.inbodyLastScan} onChange={(e) => setState((p) => ({ ...p, inbodyLastScan: e.target.value }))} /><input placeholder="WEEK-OVER-WEEK" value={state.inbodyWoW} onChange={(e) => setState((p) => ({ ...p, inbodyWoW: e.target.value }))} /><input placeholder="SPIKES / WATCH ITEMS" value={state.inbodyWatchItems} onChange={(e) => setState((p) => ({ ...p, inbodyWatchItems: e.target.value }))} /></div></section>

          <section className="tf30-panel"><h2>THICC.QUOTE OF THE DAY</h2><select value={state.quoteOfDay} onChange={(e) => setState((p) => ({ ...p, quoteOfDay: e.target.value }))}>{optionRegistry.thiccFitt.quoteOfDay.map((o) => <option key={o}>{o}</option>)}</select><blockquote>{state.quoteOfDay}</blockquote></section>

          <section className="tf30-panel"><h2>PHOTO SHOOT COUNTDOWN</h2><div className="tf30-split"><input placeholder="NEXT SHOOT" value={state.photo.nextShoot} onChange={(e) => update('photo', 'nextShoot', e.target.value)} /><input placeholder="TARGET MONTH (LAST SATURDAY)" value={state.photo.targetMonth} onChange={(e) => update('photo', 'targetMonth', e.target.value)} /><input placeholder="DAYS REMAINING" value={state.photo.daysRemaining} onChange={(e) => update('photo', 'daysRemaining', e.target.value)} /><input placeholder="SUBMISSION STATUS" value={state.photo.submissionStatus} onChange={(e) => update('photo', 'submissionStatus', e.target.value)} /><input placeholder="LAST SUBMITTED" value={state.photo.lastSubmitted} onChange={(e) => update('photo', 'lastSubmitted', e.target.value)} /></div></section>

          <section className="tf30-panel"><h2>MEDIA</h2><div className="tf30-media"><div>PROGRESS PHOTOS</div><div>GYM PHOTOS</div><div>CHECKPOINT PHOTOS</div></div></section>
        </main>
      </section>
    </section>
  );
}
