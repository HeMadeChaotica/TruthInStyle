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
  roidSensitivity: ['Low', 'Medium', 'High']
};

const emptyExercise = { exercise: '', sets: '', reps: '', weight: '', notes: '' };

export default function ThiccFittSection() {
  const [exerciseRows, setExerciseRows] = useState(Array.from({ length: 6 }, () => ({ ...emptyExercise })));
  const [form, setForm] = useState({
    gymLocation: '', season: '', workoutLength: '', arrivalTime: '',
    notesPrompt: '', notesText: '', cardioType: '', cardioDuration: '', cardioIntensity: '', cardioLocation: '', cardioNotes: '',
    bodyWeight: '', bodyFat: '', chest: '', waist: '', hips: '', armsL: '', armsR: '', thighsL: '', thighsR: '', glutes: '', bodyNotes: ''
  });
  const [vaultRows, setVaultRows] = useState(Array.from({ length: 3 }, () => ({ compound: '', ester: '', amount: '', shots: '', cycle: '', sensitivity: '' })));
  const [mediaPreview, setMediaPreview] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    const urls = mediaPreview
      .slice(0, 6)
      .filter((file) => file instanceof File)
      .map((file) => URL.createObjectURL(file));

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [mediaPreview]);

  const updateField = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const updateExercise = (idx, key, value) => setExerciseRows((p) => p.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  const updateVault = (idx, key, value) => setVaultRows((p) => p.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));

  const addExercise = () => setExerciseRows((p) => [...p, { ...emptyExercise }]);
  const gpsFill = (field) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => updateField(field, `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`));
  };

  return (
    <section className="tf-page">
      <div className="tf-overlay" />
      <header className="tf-header tf-panel">
        <img src="/ui/glyphs/section-anchors/anchor-thicc-fitt.png" alt="THICC.FITT anchor" className="tf-anchor" />
        <h1>THICC.FITT</h1>
        <label>GYM LOCATION<input value={form.gymLocation} onChange={(e) => updateField('gymLocation', e.target.value)} placeholder="ENTER GYM LOCATION" /></label>
        <button type="button" onClick={() => gpsFill('gymLocation')}>USE GPS</button>
        <label>SEASON<select value={form.season} onChange={(e) => updateField('season', e.target.value)}><option value="">SELECT SEASON</option>{opts.roidSeason.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label>WORKOUT LENGTH<select value={form.workoutLength} onChange={(e) => updateField('workoutLength', e.target.value)}><option value="">SELECT DURATION</option>{opts.roidWorkoutDuration.map((o) => <option key={o}>{o}</option>)}</select></label>
        <label>ARRIVAL TIME<input type="time" value={form.arrivalTime} onChange={(e) => updateField('arrivalTime', e.target.value)} /></label>
        <Link href="/its-getting-thicc" className="tf-client-link"><img src="/ui/glyphs/control-panel/control-thicc-fitt.png" alt="Client System" /><span>CLIENT SYSTEM<br />ITS.GETTING.THICC</span></Link>
      </header>

      <main className="tf-grid">
        <section className="tf-panel tf-exercises"><h2>1. EXERCISE LOG</h2>{exerciseRows.map((row, i) => <div key={i} className="tf-row"><input placeholder="EXERCISE" value={row.exercise} onChange={(e)=>updateExercise(i,'exercise',e.target.value)} /><input placeholder="SETS" value={row.sets} onChange={(e)=>updateExercise(i,'sets',e.target.value)} /><input placeholder="REPS" value={row.reps} onChange={(e)=>updateExercise(i,'reps',e.target.value)} /><input placeholder="WEIGHT" value={row.weight} onChange={(e)=>updateExercise(i,'weight',e.target.value)} /><input placeholder="NOTES" value={row.notes} onChange={(e)=>updateExercise(i,'notes',e.target.value)} /></div>)}<button type="button" onClick={addExercise}>+ ADD EXERCISE</button></section>
        <section className="tf-panel tf-media"><h2>2. MEDIA</h2><label className="tf-upload">UPLOAD<input type="file" multiple accept="image/*" onChange={(e) => setMediaPreview(Array.from(e.target.files || []))} /></label><div className="tf-preview">{previewUrls.map((u) => <img key={u} src={u} alt="Preview" />)}</div></section>
        <section className="tf-panel tf-notes"><h2>3. NOTES + SO HOW YOU DOIN 🫦⁉️</h2><div className="tf-row"><select value={form.notesPrompt} onChange={(e)=>updateField('notesPrompt', e.target.value)}><option>I WON’T SUM MO COACH GIMME THAT</option><option>THAT WAS DEFINITELY NOT A FART</option><option>OK TEAM LET’S CALL IT… TIME OF DEATH IS 🫪</option><option>SHE ATE BUT SHE IS SEEING STARS</option><option>I NEED A STRETCH, A SNACK, AND A MAN</option><option>I FEAR I HAVE LEFT MY SOUL ON THE LEG PRESS</option><option>GAGGED, SWEATY, AND STILL EMPLOYED</option><option>I LOOK INSANE BUT THE PUMP IS CORRECT</option><option>SOMEBODY HOLD MY PURSE AND MY VISION</option><option>I COULD CRY BUT MY GLUTES WON’T LET ME</option><option>THIS WAS HOTTER THAN IT WAS HEALTHY</option><option>I AM BOTH GOD’S STRONGEST AND WEAKEST SOLDIER</option><option>BABY I AM COOKED BUT NOT DONE</option><option>MY BODY SAID NO BUT MY EGO SAID AGAIN</option><option>IF I SIT DOWN IT IS OVER</option><option>I NEED WATER, CARBS, AND QUIET</option><option>THAT CARDIO WAS AN ACT OF VIOLENCE</option><option>I SURVIVED BUT LET’S NOT ROMANTICIZE IT</option><option>PUMPED, FILTHY, AND SPIRITUALLY REARRANGED</option><option>PUT ME IN THE VAULT AND SEAL THE DOOR</option></select><textarea value={form.notesText} onChange={(e)=>updateField('notesText', e.target.value)} placeholder="WRITE YOUR THOUGHTS HERE..." /></div></section>
        <section className="tf-panel tf-vault"><h2>4. THE VAULT (MAX 3 ENTRIES)</h2>{vaultRows.slice(0,3).map((row, i)=><div key={i} className="tf-vault-row"><span>{i+1}</span><select value={row.compound} onChange={(e)=>updateVault(i,'compound',e.target.value)}><option value="">COMPOUND</option>{opts.roidCompound.map((o)=><option key={o}>{o}</option>)}</select><select value={row.ester} onChange={(e)=>updateVault(i,'ester',e.target.value)}><option value="">ESTER</option>{opts.roidEster.map((o)=><option key={o}>{o}</option>)}</select><select value={row.amount} onChange={(e)=>updateVault(i,'amount',e.target.value)}><option value="">AMOUNT</option>{opts.roidAmount.map((o)=><option key={o}>{o}</option>)}</select><input placeholder="SHOTS" value={row.shots} onChange={(e)=>updateVault(i,'shots',e.target.value)} /><input placeholder="CYCLE" value={row.cycle} onChange={(e)=>updateVault(i,'cycle',e.target.value)} /><select value={row.sensitivity} onChange={(e)=>updateVault(i,'sensitivity',e.target.value)}><option value="">SENSITIVITY</option>{opts.roidSensitivity.map((o)=><option key={o}>{o}</option>)}</select></div>)}</section>
        <section className="tf-panel tf-cardio"><h2>5. CARDIO</h2><div className="tf-row"><select value={form.cardioType} onChange={(e)=>updateField('cardioType',e.target.value)}><option value="">SELECT TYPE</option>{opts.roidCardioType.map((o)=><option key={o}>{o}</option>)}</select><select value={form.cardioDuration} onChange={(e)=>updateField('cardioDuration',e.target.value)}><option value="">DURATION</option>{opts.roidCardioDuration.map((o)=><option key={o}>{o}</option>)}</select><input placeholder="INTENSITY" value={form.cardioIntensity} onChange={(e)=>updateField('cardioIntensity',e.target.value)} /></div><div className="tf-row"><input placeholder="ENTER CARDIO LOCATION" value={form.cardioLocation} onChange={(e)=>updateField('cardioLocation',e.target.value)} /><button type="button" onClick={() => gpsFill('cardioLocation')}>USE GPS</button></div><textarea value={form.cardioNotes} onChange={(e)=>updateField('cardioNotes',e.target.value)} placeholder="CARDIO NOTES..." /></section>
        <section className="tf-panel tf-body"><h2>6. BODY MEASUREMENTS</h2><div className="tf-body-grid">{[['weight','WEIGHT'],['bodyFat','BODY FAT %'],['chest','CHEST'],['waist','WAIST'],['hips','HIPS'],['armsL','ARMS L'],['armsR','ARMS R'],['thighsL','THIGHS L'],['thighsR','THIGHS R'],['glutes','GLUTES']].map(([k,l]) => <input key={k} placeholder={l} value={form[k]} onChange={(e)=>updateField(k,e.target.value)} />)}</div><textarea value={form.bodyNotes} onChange={(e)=>updateField('bodyNotes',e.target.value)} placeholder="BODY NOTES..." /></section>
      </main>
    </section>
  );
}
