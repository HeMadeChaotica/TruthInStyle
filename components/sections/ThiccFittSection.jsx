'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import '../../styles/sections/thicc-fitt.css';

const opts = {
  roidSeason: ['Bulking', 'Cutting', 'Recomp', 'Maintenance'],
  roidWorkoutDuration: ['30 min', '45 min', '60 min', '90 min'],
  roidCardioType: ['Run', 'Bike', 'Stairmaster', 'Walk'],
  roidCardioDuration: ['10 min', '20 min', '30 min', '45 min'],
  roidCompound: ['Testosterone', 'Nandrolone', 'Trenbolone', 'Anavar'],
  roidEster: ['Cypionate', 'Enanthate', 'Acetate', 'Undecanoate'],
  roidAmount: ['100 mg', '200 mg', '300 mg', '500 mg'],
  roidSensitivity: ['Low', 'Medium', 'High'],
  approvedPrompts: [
    'I WON’T SUM MO COACH GIMME THAT','Locked in and focused','Energy is sky high','Need to lock form','PR mindset only',
    'Pushed through plateaus','Recovery feels solid','Hydration on point','Sleep needs work','Meal prep locked',
    'Mind-muscle connection strong','Cardio felt smooth','Leg day was brutal','Upper body pump crazy','Mobility session helped',
    'Gym vibe was elite','Need better pacing','Breathing felt controlled','Confidence is up','Run it back tomorrow'
  ]
};

const emptyExercise = { exercise: '', weight: '', sets: '', reps: '' };

export default function ThiccFittSection() {
  const [exerciseRows, setExerciseRows] = useState(Array.from({ length: 5 }, () => ({ ...emptyExercise })));
  const [form, setForm] = useState({
    gymLocation: '', season: '', workoutLength: '', arrivalTime: '',
    notesPrompt: opts.approvedPrompts[0], notesText: '', cardioType: '', cardioDuration: '', cardioIntensity: '', cardioLocation: '', cardioNotes: '',
    weight: '', bodyFat: '', chest: '', waist: '', hips: '', armsL: '', armsR: '', thighsL: '', thighsR: '', glutes: '', bodyNotes: ''
  });
  const [vaultRows, setVaultRows] = useState(Array.from({ length: 3 }, () => ({ compound: '', ester: '', amount: '', shots: '', cycle: '', sensitivity: '' })));
  const [mediaPreview, setMediaPreview] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    const urls = mediaPreview.slice(0, 6).filter((file) => file instanceof File).map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [mediaPreview]);

  const updateField = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const updateExercise = (idx, key, value) => setExerciseRows((p) => p.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  const updateVault = (idx, key, value) => setVaultRows((p) => p.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  
  const gpsFill = (field) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => updateField(field, `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`));
  };

  return (
    <section className="tf-page">
      <div className="tf-overlay" />
      <img className="tf-title-glyph" src="/background/THICC-FITT-title.jpeg" alt="THICC.FITT" />
      <Link href="/its-getting-thicc" className="tf-client-link tf-floating-link" aria-label="Crystal dumbbell link"><img src="/ui/glyphs/triggers/glyph-crystal-dumbbell.png" alt="Crystal dumbbell" /></Link>
      <header className="tf-header tf-panel">
        <label>GYM LOCATION<input value={form.gymLocation} onChange={(e) => updateField('gymLocation', e.target.value)} placeholder="ENTER GYM LOCATION" /></label>
        <button type="button" onClick={() => gpsFill('gymLocation')}>USE GPS</button>
        <label>SEASON<select value={form.season} onChange={(e) => updateField('season', e.target.value)}><option value="">SELECT SEASON</option>{opts.roidSeason.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label>WORKOUT LENGTH<select value={form.workoutLength} onChange={(e) => updateField('workoutLength', e.target.value)}><option value="">SELECT DURATION</option>{opts.roidWorkoutDuration.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label>ARRIVAL TIME<input type="time" value={form.arrivalTime} onChange={(e) => updateField('arrivalTime', e.target.value)} /></label>
      </header>

      <main className="tf-grid">
        <section className="tf-panel tf-vault"><h2>THE VAULT</h2>{vaultRows.slice(0,3).map((row, i)=><div key={i} className="tf-vault-row"><select value={row.compound} onChange={(e)=>updateVault(i,'compound',e.target.value)}><option value="">COMPOUND</option>{opts.roidCompound.map((o)=><option key={o}>{o}</option>)}</select><select value={row.ester} onChange={(e)=>updateVault(i,'ester',e.target.value)}><option value="">ESTER</option>{opts.roidEster.map((o)=><option key={o}>{o}</option>)}</select><select value={row.amount} onChange={(e)=>updateVault(i,'amount',e.target.value)}><option value="">AMOUNT</option>{opts.roidAmount.map((o)=><option key={o}>{o}</option>)}</select><input placeholder="SHOTS" value={row.shots} onChange={(e)=>updateVault(i,'shots',e.target.value)} /><input placeholder="CYCLE" value={row.cycle} onChange={(e)=>updateVault(i,'cycle',e.target.value)} /><select value={row.sensitivity} onChange={(e)=>updateVault(i,'sensitivity',e.target.value)}><option value="">SENSITIVITY</option>{opts.roidSensitivity.map((o)=><option key={o}>{o}</option>)}</select></div>)}</section>
        <section className="tf-panel tf-exercises"><h2>EXERCISE LOG</h2>{exerciseRows.slice(0,5).map((row, i) => <div key={i} className="tf-row"><input placeholder="EXERCISE" value={row.exercise} onChange={(e)=>updateExercise(i,'exercise',e.target.value)} /><input placeholder="WEIGHT" value={row.weight} onChange={(e)=>updateExercise(i,'weight',e.target.value)} /><input placeholder="SETS" value={row.sets} onChange={(e)=>updateExercise(i,'sets',e.target.value)} /><input placeholder="REPS" value={row.reps} onChange={(e)=>updateExercise(i,'reps',e.target.value)} /></div>)}</section>
        <section className="tf-panel tf-stats"><h2>STATS</h2><div className="tf-stats-grid">{[['weight','WEIGHT'],['bodyFat','BODY FAT %'],['chest','CHEST'],['waist','WAIST'],['hips','HIPS'],['armsL','ARMS L'],['armsR','ARMS R'],['thighsL','THIGHS L'],['thighsR','THIGHS R'],['glutes','GLUTES']].map(([k,l]) => <input key={k} placeholder={l} value={form[k]} onChange={(e)=>updateField(k,e.target.value)} />)}</div><textarea value={form.bodyNotes} onChange={(e)=>updateField('bodyNotes',e.target.value)} placeholder="NOTES" /></section>
        <section className="tf-panel tf-cardio"><h2>CARDIO</h2><div className="tf-row"><select value={form.cardioType} onChange={(e)=>updateField('cardioType',e.target.value)}><option value="">SELECT TYPE</option>{opts.roidCardioType.map((o)=><option key={o}>{o}</option>)}</select><select value={form.cardioDuration} onChange={(e)=>updateField('cardioDuration',e.target.value)}><option value="">DURATION</option>{opts.roidCardioDuration.map((o)=><option key={o}>{o}</option>)}</select><input placeholder="INTENSITY" value={form.cardioIntensity} onChange={(e)=>updateField('cardioIntensity',e.target.value)} /></div><div className="tf-row"><input placeholder="ENTER CARDIO LOCATION" value={form.cardioLocation} onChange={(e)=>updateField('cardioLocation',e.target.value)} /><button type="button" onClick={() => gpsFill('cardioLocation')}>USE GPS</button></div><textarea value={form.cardioNotes} onChange={(e)=>updateField('cardioNotes',e.target.value)} placeholder="CARDIO NOTES" /></section>
        <section className="tf-panel tf-notes"><h2>SO HOW YOU DOIN 🫦⁉️</h2><div className="tf-notes-stack"><select value={form.notesPrompt} onChange={(e)=>updateField('notesPrompt', e.target.value)}>{opts.approvedPrompts.map((o)=><option key={o}>{o}</option>)}</select><textarea value={form.notesText} onChange={(e)=>updateField('notesText', e.target.value)} placeholder="WRITE YOUR THOUGHTS HERE..." /></div></section>
        <section className="tf-panel tf-body"><h2>MEDIA</h2><label className="tf-upload">UPLOAD<input type="file" multiple accept="image/*" onChange={(e) => setMediaPreview(Array.from(e.target.files || []))} /></label><div className="tf-preview">{previewUrls.map((u) => <img key={u} src={u} alt="Preview" />)}</div></section>
      </main>
    </section>
  );
}
