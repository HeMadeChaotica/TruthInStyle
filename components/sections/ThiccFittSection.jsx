'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOptionsForFamily } from '../../src/clockit/dropdownOptions';
import styles from './ThiccFittSection.module.css';

const STORAGE_KEY = 'thicc_fitt_day';
const SO_HOW_YOU_DOIN = getOptionsForFamily('roidPromptedNotes');
const SEASONS = getOptionsForFamily('roidSeason');
const WORKOUT_DURATION = getOptionsForFamily('roidWorkoutDuration');
const CARDIO_TYPE = getOptionsForFamily('roidCardioType');
const CARDIO_DURATION = ['10 MIN', '15 MIN', ...getOptionsForFamily('roidCardioDuration'), '60 MIN', '75 MIN'];
const COMPOUNDS = getOptionsForFamily('roidCompound');
const ESTERS = getOptionsForFamily('roidEster');
const AMOUNTS = getOptionsForFamily('roidAmount');
const SENSITIVITY = getOptionsForFamily('roidSensitivity');

const emptyExercise = { name: '', sets: '', reps: '', weight: '', notes: '' };
const emptyVault = { compound: '', ester: '', amount: '', shots: '', cycle: '', sensitivity: '' };
const initial = { gym_location: '', gym_location_source: '', arrival_time: '', season: '', workout_length: '', exercise_log: [emptyExercise], media_refs: [], notes_prompt_key: '', notes_text: '', vault_entries: [emptyVault], cardio_type: '', cardio_duration: '', cardio_intensity: '', cardio_location: '', cardio_location_source: '', cardio_notes: '', body_measurements: { weight_lb: '', body_fat_percent: '', chest: '', waist: '', hips: '', arms_left: '', arms_right: '', thighs_left: '', thighs_right: '', glutes: '', notes: '' } };

export default function ThiccFittSection() {
  const [data, setData] = useState(initial);
  useEffect(() => { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setData((p) => ({ ...p, ...JSON.parse(raw) })); }, []);
  useEffect(() => { const t = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)), 250); return () => clearTimeout(t); }, [data]);
  const set = (k, v) => setData((p) => ({ ...p, [k]: v }));
  const gps = (field, source) => navigator.geolocation?.getCurrentPosition((p) => { set(field, `${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`); set(source, 'gps'); });
  const upload = (e) => { const refs = Array.from(e.target.files || []).map((f) => ({ id: crypto.randomUUID(), name: f.name, type: f.type, url: URL.createObjectURL(f) })); set('media_refs', [...data.media_refs, ...refs]); localStorage.setItem('media_library', JSON.stringify([...(JSON.parse(localStorage.getItem('media_library') || '[]')), ...refs])); };

  return <main className={styles.page}><div className={styles.swirl} /><section className={styles.grid}>
    <header className={styles.header}><div><h1 className={styles.anchor}>THICC.FITT</h1><p className={styles.sub}>ROIDBOI PERFORMANCE LAB</p></div><Link href="/its-getting-thicc" className={styles.dumbbell}>💎 CRYSTAL DUMBBELL</Link>
      <div className={styles.field}><label>GYM LOCATION</label><div className={styles.inline}><input value={data.gym_location} onChange={(e) => { set('gym_location', e.target.value); set('gym_location_source', 'manual'); }} /><button onClick={() => gps('gym_location', 'gym_location_source')}>USE GPS</button></div></div>
      <div className={styles.field}><label>SEASON</label><select value={data.season} onChange={(e) => set('season', e.target.value)}><option value="" />{SEASONS.map((x) => <option key={x}>{x}</option>)}</select></div>
      <div className={styles.field}><label>WORKOUT LENGTH</label><select value={data.workout_length} onChange={(e) => set('workout_length', e.target.value)}><option value="" />{WORKOUT_DURATION.map((x) => <option key={x}>{x}</option>)}</select></div>
      <div className={styles.field}><label>ARRIVAL TIME</label><input type="time" value={data.arrival_time} onChange={(e) => set('arrival_time', e.target.value)} /></div></header>

    <section className={styles.exercise}><h2><span>1</span> EXERCISE LOG</h2>{data.exercise_log.map((r, i) => <div key={i} className={styles.r5}>{['name','sets','reps','weight','notes'].map((k) => <input key={k} placeholder={k.toUpperCase()} value={r[k]} onChange={(e)=>{const n=[...data.exercise_log];n[i]={...n[i],[k]:e.target.value};set('exercise_log',n);}} />)}</div>)}<button onClick={() => set('exercise_log', [...data.exercise_log, { ...emptyExercise }])}>+ ADD EXERCISE</button></section>
    <section className={styles.media}><h2><span>2</span> MEDIA</h2><input type="file" accept="image/*,video/*" multiple onChange={upload} /><div className={styles.thumb}>{data.media_refs.map((m) => m.type.startsWith('image/') ? <img key={m.id} src={m.url} alt={m.name} /> : <div key={m.id}>{m.name}</div>)}</div></section>
    <section className={styles.notes}><h2><span>3</span> NOTES + SO HOW YOU DOIN 🫪⁉️</h2><select value={data.notes_prompt_key} onChange={(e) => set('notes_prompt_key', e.target.value)}><option value="" />{SO_HOW_YOU_DOIN.map((x) => <option key={x}>{x}</option>)}</select><textarea value={data.notes_text} onChange={(e) => set('notes_text', e.target.value)} placeholder={data.notes_prompt_key || 'WRITE YOUR RESPONSE'} /></section>
    <section className={styles.vault}><h2><span>4</span> THE VAULT</h2>{data.vault_entries.map((r, i) => <div key={i} className={styles.r6}><select value={r.compound} onChange={(e)=>{const n=[...data.vault_entries];n[i]={...n[i],compound:e.target.value};set('vault_entries',n);}}><option value="" />{COMPOUNDS.map((x)=><option key={x}>{x}</option>)}</select><select value={r.ester} onChange={(e)=>{const n=[...data.vault_entries];n[i]={...n[i],ester:e.target.value};set('vault_entries',n);}}><option value="" />{ESTERS.map((x)=><option key={x}>{x}</option>)}</select><select value={r.amount} onChange={(e)=>{const n=[...data.vault_entries];n[i]={...n[i],amount:e.target.value};set('vault_entries',n);}}><option value="" />{AMOUNTS.map((x)=><option key={x}>{x}</option>)}</select><input placeholder='SHOTS' value={r.shots} onChange={(e)=>{const n=[...data.vault_entries];n[i]={...n[i],shots:e.target.value};set('vault_entries',n);}}/><input placeholder='CYCLE' value={r.cycle} onChange={(e)=>{const n=[...data.vault_entries];n[i]={...n[i],cycle:e.target.value};set('vault_entries',n);}}/><select value={r.sensitivity} onChange={(e)=>{const n=[...data.vault_entries];n[i]={...n[i],sensitivity:e.target.value};set('vault_entries',n);}}><option value="" />{SENSITIVITY.map((x)=><option key={x}>{x}</option>)}</select></div>)}<button onClick={() => data.vault_entries.length < 3 && set('vault_entries', [...data.vault_entries, { ...emptyVault }])}>+ ADD ENTRY</button></section>
    <section className={styles.cardio}><h2><span>5</span> CARDIO</h2><div className={styles.r3}><select value={data.cardio_type} onChange={(e)=>set('cardio_type', e.target.value)}><option value="" />{CARDIO_TYPE.map((x)=><option key={x}>{x}</option>)}</select><select value={data.cardio_duration} onChange={(e)=>set('cardio_duration', e.target.value)}><option value="" />{[...new Set(CARDIO_DURATION)].map((x)=><option key={x}>{x}</option>)}</select><select value={data.cardio_intensity} onChange={(e)=>set('cardio_intensity', e.target.value)}><option value="" /><option>LOW</option><option>MODERATE</option><option>HIGH</option><option>DEMON</option></select></div><div className={styles.inline}><input value={data.cardio_location} placeholder='CARDIO LOCATION' onChange={(e)=>{set('cardio_location',e.target.value);set('cardio_location_source','manual');}}/><button onClick={() => gps('cardio_location', 'cardio_location_source')}>USE GPS</button></div><textarea value={data.cardio_notes} placeholder='OPTIONAL NOTES' onChange={(e)=>set('cardio_notes', e.target.value)} /></section>
    <section className={styles.body}><h2><span>7</span> BODY MEASUREMENTS</h2><div className={styles.bodyGrid}>{Object.entries(data.body_measurements).map(([k,v]) => <label key={k}>{k.replaceAll('_',' ')}<input value={v} onChange={(e)=>set('body_measurements',{...data.body_measurements,[k]:e.target.value})} /></label>)}</div></section>
    <div className={styles.footer}>DISCIPLINE • POWER • GROWTH</div>
  </section></main>;
}
