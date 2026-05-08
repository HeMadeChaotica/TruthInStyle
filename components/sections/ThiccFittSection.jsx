'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/thicc-fitt.css';

const STORAGE_KEY = 'thicc-fitt-deeperdaddy';
const DAILY_SEND_KEY = 'thicc-fitt-vault-sends';

const opts = {
  roidSeason: ['BULKING', 'CUTTING', 'RECOMP', 'MAINTENANCE'],
  roidWorkoutDuration: ['30 MIN', '45 MIN', '60 MIN', '90 MIN'],
  roidCardioType: ['RUN', 'BIKE', 'STAIRMASTER', 'WALK'],
  roidCardioDuration: ['10 MIN', '20 MIN', '30 MIN', '45 MIN'],
  roidIntensity: ['LOW', 'MODERATE', 'HIGH', 'MAX'],
  roidCompound: ['Testosterone', 'Nandrolone', 'Trenbolone', 'Anavar'],
  roidEster: ['Cypionate', 'Enanthate', 'Acetate', 'Undecanoate'],
  roidAmount: ['100 mg', '200 mg', '300 mg', '500 mg'],
  roidSensitivity: ['Low', 'Medium', 'High'],
  soreness: ['FRESH', 'MILD', 'MODERATE', 'HEAVY', 'WRECKED'],
  approvedPrompts: [
    'I WON’T SUM MO COACH GIMME THAT', 'LOCKED IN AND FOCUSED', 'ENERGY IS SKY HIGH', 'NEED TO LOCK FORM', 'PR MINDSET ONLY',
    'PUSHED THROUGH PLATEAUS', 'RECOVERY FEELS SOLID', 'HYDRATION ON POINT', 'SLEEP NEEDS WORK', 'MEAL PREP LOCKED',
    'MIND-MUSCLE CONNECTION STRONG', 'CARDIO FELT SMOOTH', 'LEG DAY WAS BRUTAL', 'UPPER BODY PUMP CRAZY', 'MOBILITY SESSION HELPED',
    'GYM VIBE WAS ELITE', 'NEED BETTER PACING', 'BREATHING FELT CONTROLLED', 'CONFIDENCE IS UP', 'RUN IT BACK TOMORROW'
  ]
};

const emptyExercise = { exercise: '', weight: '', reps: '', sets: '', failure: '' };
const emptyVault = { compound: '', ester: '', amount: '', shotOf: '', cycleLength: '', sensitivity: '', weekOf: '' };

const initialState = {
  exerciseRows: Array.from({ length: 5 }, () => ({ ...emptyExercise })),
  form: {
    gymLocation: '', season: '', workoutLength: '', arrivalTime: '', soreness: '',
    notesPrompt: opts.approvedPrompts[0], notesText: '', cardioType: '', cardioDuration: '', cardioIntensity: '', cardioLocation: '', cardioNotes: '',
    weight: '', bodyFat: '', chest: '', waist: '', hips: '', armsL: '', armsR: '', thighsL: '', thighsR: '', glutes: '', bodyNotes: ''
  },
  vaultRows: Array.from({ length: 1 }, () => ({ ...emptyVault }))
};

export default function ThiccFittSection() {
  const [state, setState] = useState(initialState);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [sendCount, setSendCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setState((prev) => ({ ...prev, ...JSON.parse(saved) }));
    const stamp = localStorage.getItem(DAILY_SEND_KEY);
    if (stamp) {
      const parsed = JSON.parse(stamp);
      if (parsed?.date === new Date().toISOString().slice(0, 10)) setSendCount(parsed.count || 0);
    }
  }, []);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), [state]);
  useEffect(() => {
    const urls = mediaPreview.slice(0, 3).filter((file) => file instanceof File).map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [mediaPreview]);
  const canSend = sendCount < 2;
  const updateField = (key, value) => setState((p) => ({ ...p, form: { ...p.form, [key]: value } }));
  const updateExercise = (idx, key, value) => setState((p) => ({ ...p, exerciseRows: p.exerciseRows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)) }));
  const updateVault = (idx, key, value) => setState((p) => ({ ...p, vaultRows: p.vaultRows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)) }));
  const addExerciseRow = () => setState((p) => ({ ...p, exerciseRows: [...p.exerciseRows, { ...emptyExercise }] }));
  const sendToAssurer = () => {
    if (!canSend) return;
    const next = sendCount + 1;
    setSendCount(next);
    localStorage.setItem(DAILY_SEND_KEY, JSON.stringify({ date: new Date().toISOString().slice(0, 10), count: next }));
    window.location.href = '/the-assurer';
  };

  const resetSends = () => {
    setSendCount(0);
    localStorage.removeItem(DAILY_SEND_KEY);
  };

  const statFields = useMemo(() => [['weight', 'WEIGHT'], ['bodyFat', 'BODY FAT %'], ['chest', 'CHEST'], ['waist', 'WAIST'], ['hips', 'HIPS'], ['armsL', 'ARMS L'], ['armsR', 'ARMS R'], ['thighsL', 'THIGHS L'], ['thighsR', 'THIGHS R'], ['glutes', 'GLUTES']], []);

  return <section className="tf-page"><div className="tf-overlay" />
    <img className="tf-title-glyph" src="/backgrounds/THICC-FITT/thicc-title.png" alt="THICC.FITT" />
    <Link href="/its-getting-thicc" className="tf-client-link" aria-label="Crystal dumbbell link"><img src="/ui/glyphs/triggers/glyph-crystal-dumbbell.png" alt="Crystal dumbbell" /></Link>
    <Link href="/clock-it" className="tf-clockit-link" aria-label="Clock.It temporary access">🐝 CLOCK.IT</Link>
    <header className="tf-header tf-panel">
      <input value={state.form.gymLocation} onChange={(e) => updateField('gymLocation', e.target.value)} placeholder="GYM LOCATION" />
      <input type="time" value={state.form.arrivalTime} onChange={(e) => updateField('arrivalTime', e.target.value)} />
      <select value={state.form.workoutLength} onChange={(e) => updateField('workoutLength', e.target.value)}><option value="">WORKOUT LENGTH</option>{opts.roidWorkoutDuration.map((o) => <option key={o}>{o}</option>)}</select>
      <select value={state.form.season} onChange={(e) => updateField('season', e.target.value)}><option value="">SEASON</option>{opts.roidSeason.map((o) => <option key={o}>{o}</option>)}</select>
      <select value={state.form.soreness} onChange={(e) => updateField('soreness', e.target.value)}><option value="">SORENESS LEVEL</option>{opts.soreness.map((o) => <option key={o}>{o}</option>)}</select>
      
    </header>

    <main className="tf-grid">
      <section className="tf-panel tf-exercises"><h2>EXERCISE LOG</h2>{state.exerciseRows.map((row, i) => <div key={i} className="tf-row"><input placeholder="EXERCISE" value={row.exercise} onChange={(e) => updateExercise(i, 'exercise', e.target.value)} /><input placeholder="WEIGHT" value={row.weight} onChange={(e) => updateExercise(i, 'weight', e.target.value)} /><input placeholder="REPS" value={row.reps} onChange={(e) => updateExercise(i, 'reps', e.target.value)} /><input placeholder="SETS" value={row.sets} onChange={(e) => updateExercise(i, 'sets', e.target.value)} /><select value={row.failure} onChange={(e) => updateExercise(i, 'failure', e.target.value)}><option value="">FAILURE Y/N</option><option>Y</option><option>N</option></select></div>)}<button className="tf-add-row" type="button" onClick={addExerciseRow}>+ ADD EXERCISE RPM</button></section>
      <section className="tf-panel tf-cardio-mid"><h2>CARDIO</h2><div className="tf-row"><select value={state.form.cardioType} onChange={(e) => updateField('cardioType', e.target.value)}><option value="">TYPE</option>{opts.roidCardioType.map((o) => <option key={o}>{o}</option>)}</select><select value={state.form.cardioDuration} onChange={(e) => updateField('cardioDuration', e.target.value)}><option value="">DURATION</option>{opts.roidCardioDuration.map((o) => <option key={o}>{o}</option>)}</select><select value={state.form.cardioIntensity} onChange={(e) => updateField('cardioIntensity', e.target.value)}><option value="">INTENSITY</option>{opts.roidIntensity.map((o) => <option key={o}>{o}</option>)}</select></div><div className="tf-row"><input placeholder="CARDIO LOCATION" value={state.form.cardioLocation} onChange={(e) => updateField('cardioLocation', e.target.value)} /><textarea value={state.form.cardioNotes} onChange={(e) => updateField('cardioNotes', e.target.value)} placeholder="NOTES" /></div></section>
      <section className="tf-panel tf-notes"><h2>SO HOW YOU DOIN 🫪⁉️</h2><div className="tf-notes-stack"><select value={state.form.notesPrompt} onChange={(e) => updateField('notesPrompt', e.target.value)}>{opts.approvedPrompts.map((o) => <option key={o}>{o}</option>)}</select><textarea value={state.form.notesText} onChange={(e) => updateField('notesText', e.target.value)} placeholder="WRITE YOUR THOUGHTS HERE..." /></div></section>
      <section className="tf-panel tf-body"><h2>MEDIA</h2><div className="tf-media-grid"><label className="tf-upload">UPLOAD<input type="file" accept="image/*" onChange={(e) => setMediaPreview([...(mediaPreview.slice(1)), ...(e.target.files?.[0] ? [e.target.files[0]] : [])].slice(0, 3))} /></label>{[0, 1].map((slot) => <label key={slot} className="tf-upload">{previewUrls[slot] ? <img src={previewUrls[slot]} alt="Preview" /> : 'MEDIA'}<input type="file" accept="image/*" onChange={(e) => { if (!e.target.files?.[0]) return; const next = [...mediaPreview]; next[slot + 1] = e.target.files[0]; setMediaPreview(next.slice(0, 3)); }} /></label>)}</div></section>
      <section className="tf-panel tf-left-stack"><section className="tf-panel tf-stats"><h2>STATS</h2><div className="tf-stats-scroll"><div className="tf-stats-grid">{statFields.map(([k, l]) => <label key={k} className="tf-labeled"><span>{l}</span><input value={state.form[k]} onChange={(e) => updateField(k, e.target.value)} /></label>)}</div><textarea value={state.form.bodyNotes} onChange={(e) => updateField('bodyNotes', e.target.value)} placeholder="NOTES" /></div></section><section className="tf-panel tf-vault"><h2>THE VAULT</h2><div className="tf-vault-scroll">{state.vaultRows.map((row, i) => <div key={i} className="tf-vault-stack"><label className="tf-labeled"><span>COMPOUND</span><select value={row.compound} onChange={(e) => updateVault(i, 'compound', e.target.value)}><option value=""></option>{opts.roidCompound.map((o) => <option key={o}>{o}</option>)}</select></label><label className="tf-labeled"><span>ESTER</span><select value={row.ester} onChange={(e) => updateVault(i, 'ester', e.target.value)}><option value=""></option>{opts.roidEster.map((o) => <option key={o}>{o}</option>)}</select></label><label className="tf-labeled"><span>AMOUNT</span><select value={row.amount} onChange={(e) => updateVault(i, 'amount', e.target.value)}><option value=""></option>{opts.roidAmount.map((o) => <option key={o}>{o}</option>)}</select></label><label className="tf-labeled tf-inline-fill"><span>SHOT __ OF __</span><input value={row.shotOf} onChange={(e) => updateVault(i, 'shotOf', e.target.value)} /></label><label className="tf-labeled"><span>SENSITIVITY</span><select value={row.sensitivity} onChange={(e) => updateVault(i, 'sensitivity', e.target.value)}><option value=""></option>{opts.roidSensitivity.map((o) => <option key={o}>{o}</option>)}</select></label><label className="tf-labeled tf-inline-fill"><span>CYCLE WEEK __ OF __</span><input value={row.weekOf} onChange={(e) => updateVault(i, 'weekOf', e.target.value)} /></label></div>)}<div className="tf-pump-wrap"><button type="button" className="tf-pump-trigger" onClick={sendToAssurer} onDoubleClick={resetSends} disabled={!canSend} aria-label="Pump It send trigger"><img src="/backgrounds/THICC-FITT/pump-it.PNG" alt="PUMP-IT GLYPH" /></button></div></div></section><section className="tf-panel tf-mantra"><h2>PERSONAL MANTRA</h2><p>TO REMAIN ORDINARY INSULTS MY STORY</p><p>... LETTING EGO GET THE GLORY</p><p>REDEMPTION IS NOT A DO OVER</p><p>... ITS A DUE FORWARD</p><p>PROGRESS IS PROGRESS</p></section></section>
    </main>
  </section>;
}
