'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/sections/universal-frame.css';
import '../../styles/sections/da-eater.css';
import { ScenePlate, SectionShell } from '../shared/UniversalSectionFrame';
import { calculateDaEaterTotals, deleteCheatFlexEntry, deleteMealEntry, deleteSupplementEntry, getDaEaterDay, saveDaEaterDay, upsertCheatFlexEntry, upsertMealEntry, upsertSupplementEntry } from '../../src/services/daEaterService';
import { uploadPrivateImage } from '../../src/services/mediaUploadService';
import { CLOCK_IT_KEYS, useClockItNumericOptions, useClockItOptions } from '../../lib/dropdowns/clockItRegistry';
import FloatingCrystalTileDeck from '../shared/FloatingCrystalTileDeck';

const today = () => new Date().toISOString().slice(0, 10);
const THICC_DAY_STORAGE_KEY = 'truthinstyle_da_eater_thicc_treat_day_v1';
const EMPTY_REUP_ROWS = () => Array.from({ length: 10 }, () => ({ amount: '', status: '', mealName: '' }));

export default function DaEaterSection() {
  const MEAL_TYPES = useClockItOptions(CLOCK_IT_KEYS.daEaterMealTypes);
  const SUP_TYPES = useClockItOptions(CLOCK_IT_KEYS.daEaterSupplementTypes);
  const supplementUnits = useClockItOptions(CLOCK_IT_KEYS.daEaterSupplementUnits);
  const CHEAT_TYPES = useClockItOptions(CLOCK_IT_KEYS.daEaterTreatTypes);
  const THICC_DAYS = useClockItOptions(CLOCK_IT_KEYS.daEaterTreatDays);
  const worthItOptions = useClockItNumericOptions(CLOCK_IT_KEYS.worthItPercent);
  const [date, setDate] = useState(today());
  const [day, setDay] = useState(() => getDaEaterDay(today()));
  const [mealForm, setMealForm] = useState({ id: '', type: 'BREAKFAST', name: '', time: '', protein: '', carbs: '', fats: '', calories: '', waterOz: '' });
  const [suppForm, setSuppForm] = useState({ id: '', type: 'VITAMIN', name: '', time: '', amount: '', unit: '', notes: '' });
  const [cheatForm, setCheatForm] = useState({ id: '', type: 'CHEAT MEAL', day: '', meal: '', dessert: '', roughCalories: '', worthItPercent: '', notes: '' });
  const [cravingNotes, setCravingNotes] = useState({ craving: '', trigger: '', intensity: '', response: '', notes: '' });
  const fileInputRefs = useRef({});

  const saveDay = (next) => { const saved = saveDaEaterDay(next); setDay(saved); };
  const reupRows = [...(day.reupRows || []), ...EMPTY_REUP_ROWS()].slice(0, 10);
  const updateReupRow = (index, field, value) => {
    const nextRows = reupRows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row);
    saveDay({ ...day, reupRows: nextRows });
  };
  const totals = useMemo(() => calculateDaEaterTotals(day), [day]);
  const dayName = useMemo(() => new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(), [date]);

  const getInitialThiccDay = () => {
    if (THICC_DAYS.includes(dayName)) return dayName;
    if (typeof window !== 'undefined') {
      const remembered = window.localStorage.getItem(THICC_DAY_STORAGE_KEY);
      if (THICC_DAYS.includes(remembered)) return remembered;
    }
    return 'WEDNESDAY';
  };
  const [selectedThiccDay, setSelectedThiccDay] = useState(getInitialThiccDay);


  useEffect(() => {
    if (THICC_DAYS.includes(dayName)) {
      selectThiccDay(dayName);
    }
  }, [dayName, THICC_DAYS]);
  const photoLog = day.photoLog || [];
  const mediaLibraryApi = typeof window !== 'undefined' ? (window.media_library || window.mediaLibrary || window.MediaLibrary || null) : null;
  const hasNativePicker = typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function';

  const updatePhotoSlot = (slot, nextValues) => {
    const nextPhotoLog = (day.photoLog || []).map((entry) => (entry.slot === slot ? { ...entry, ...nextValues } : entry));
    saveDay({ ...day, photoLog: nextPhotoLog });
  };

  const pickLibraryPhoto = async (slot) => {
    try {
      if (mediaLibraryApi?.pick) {
        const picked = await mediaLibraryApi.pick({ type: 'image' });
        if (!picked) return;
        updatePhotoSlot(slot, { photoRef: picked, description: day.photoLog?.find((x) => x.slot === slot)?.description || '' });
        return;
      }
      if (hasNativePicker) {
        const [handle] = await window.showOpenFilePicker({ multiple: false, types: [{ description: 'Images', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] } }] });
        if (!handle) return;
        const safeRef = { source: 'native_library_picker', name: handle.name || `slot_${slot}_image`, kind: handle.kind || 'file', handleName: handle.name || '' };
        updatePhotoSlot(slot, { photoRef: safeRef, description: day.photoLog?.find((x) => x.slot === slot)?.description || '' });
        return;
      }
      if (fileInputRefs.current[slot]) {
        console.warn('DA.EATER media library unavailable; using file-input fallback', { slot, reason: 'media_library_api_missing' });
        fileInputRefs.current[slot].click();
        return;
      }
      console.warn('DA.EATER media library unavailable and file-input fallback missing', { slot, reason: 'media_library_api_missing_and_file_input_unbound' });
    } catch (error) {
      console.warn('DA.EATER photo pick failed', error);
    }
  };

  const handleFileFallback = async (slot, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await uploadPrivateImage(file, { context: 'da-eater', sourceDate: date });
      updatePhotoSlot(slot, { photoRef: uploaded.url, mediaPath: uploaded.path, mediaId: uploaded.id, description: day.photoLog?.find((x) => x.slot === slot)?.description || '' });
    } catch (error) {
      console.warn('DA.EATER photo upload failed', error);
    }
  };

  const saveMeal = () => {
    const normalizedMeal = mealForm.type === 'WATER'
      ? { ...mealForm, protein: '', carbs: '', fats: '', calories: '', waterOz: mealForm.waterOz || '' }
      : { ...mealForm, waterOz: '' };
    const next = upsertMealEntry(date, normalizedMeal);
    setDay(next);
    setMealForm({ id: '', type: 'BREAKFAST', name: '', time: '', protein: '', carbs: '', fats: '', calories: '', waterOz: '' });
  };
  const saveSupplement = () => { const next = upsertSupplementEntry(date, suppForm); setDay(next); setSuppForm({ id: '', type: 'VITAMIN', name: '', time: '', amount: '', unit: '', notes: '' }); };
  const selectThiccDay = (nextDay) => {
    setSelectedThiccDay(nextDay);
    if (typeof window !== 'undefined') window.localStorage.setItem(THICC_DAY_STORAGE_KEY, nextDay);
  };

  const saveCheat = () => {
    const next = upsertCheatFlexEntry(date, { ...cheatForm, day: selectedThiccDay });
    setDay(next);
    setCheatForm({ id: '', type: 'CHEAT MEAL', day: '', meal: '', dessert: '', roughCalories: '', worthItPercent: '', notes: '' });
  };

  const shelves = [
    { id: 'A', columns: 1, panels: [{ id: 'macro', token: 'hero-strip', className: 'da-eater-panel da-eater-macro-hero', content: <>{[['PROTEIN','protein','g'],['CARBS','carbs','g'],['FATS','fats','g'],['CALORIES','calories','cal'],['WATER','waterOz','oz']].map(([label,key,unit]) => { const goal = totals.targets[key]; const current = totals.totals[key]; const p = totals.progress[key]; return <div className="da-eater-macro-row" key={key}><span>{label}</span><span>GOAL {goal}{unit.toUpperCase()}</span><div className={`da-eater-bar da-eater-bar-${key}`}><div style={{ width: `${Math.min(p,100)}%` }} /></div><span>{p.toFixed(0)}%</span><span>{Math.max(goal-current,0).toFixed(0)}{unit.toUpperCase()} LEFT</span></div>; })}</> }] },
    { id: 'B', columns: 1, panels: [{ id: 'meals', token: 'medium', className: 'da-eater-panel', content: <><div className="da-eater-meal-head-row"><h2>THICC.EATS</h2><h2>THICC.LOG</h2></div><div className="da-eater-meal-log-layout"><div className="da-eater-meal-input-stack"><select value={mealForm.type} onChange={(e)=>setMealForm({...mealForm,type:e.target.value})}>{MEAL_TYPES.map((x)=><option key={x}>{x}</option>)}</select><input placeholder="MEAL NAME" value={mealForm.name} onChange={(e)=>setMealForm({...mealForm,name:e.target.value})}/><input type="time" value={mealForm.time} onChange={(e)=>setMealForm({...mealForm,time:e.target.value})}/>{mealForm.type === 'WATER' ? <input placeholder="WATER OZ" value={mealForm.waterOz} onChange={(e)=>setMealForm({...mealForm,waterOz:e.target.value})}/> : <><input placeholder="PROTEIN" value={mealForm.protein} onChange={(e)=>setMealForm({...mealForm,protein:e.target.value})}/><input placeholder="CARBS" value={mealForm.carbs} onChange={(e)=>setMealForm({...mealForm,carbs:e.target.value})}/><input placeholder="FATS" value={mealForm.fats} onChange={(e)=>setMealForm({...mealForm,fats:e.target.value})}/><input placeholder="CALORIES" value={mealForm.calories} onChange={(e)=>setMealForm({...mealForm,calories:e.target.value})}/></>}<button onClick={saveMeal}>SAVE MEAL</button></div><div className="da-eater-meal-saved-list">{(day.meals||[]).length===0 ? <p className="da-eater-empty">NO SAVED MEALS YET.</p> : (day.meals||[]).map((m)=><div key={m.id} className="da-eater-meal-card"><div className="da-eater-meal-card-main"><strong>{m.type} • {m.name || 'UNTITLED'}</strong><span>{m.time || 'TIME NOT SET'}</span><div className="da-eater-meal-macros">{m.type === 'WATER' ? <span>WATER {m.waterOz || 0}OZ</span> : <><span>P {m.protein || 0}</span><span>C {m.carbs || 0}</span><span>F {m.fats || 0}</span><span>KCAL {m.calories || 0}</span></>}</div></div><div className="da-eater-meal-controls"><button onClick={()=>setMealForm(m)}>EDIT</button><button onClick={()=>setDay(deleteMealEntry(date,m.id))}>DELETE</button></div></div>)}</div></div></> }] },
    { id: 'C', columns: 1, panels: [{ id: 'fixation-photo-log', token: 'medium', className: 'da-eater-panel da-eater-fixation-log', content: <><h2>THICC.OBSESSION</h2><div className="da-eater-photo-grid">{photoLog.map((slotEntry) => <div className="da-eater-photo-slot" key={slotEntry.slot}><div className="da-eater-photo-body">{slotEntry.photoRef ? <><div className="da-eater-photo-ref">SELECTED: {typeof slotEntry.photoRef === 'string' ? slotEntry.photoRef : (slotEntry.photoRef.name || 'LIBRARY_MEDIA_REFERENCE')}</div><div className="da-eater-photo-actions"><button type="button" onClick={() => pickLibraryPhoto(slotEntry.slot)}>REPLACE</button><button type="button" onClick={() => updatePhotoSlot(slotEntry.slot, { photoRef: '' })}>REMOVE</button></div></> : <><div className="da-eater-photo-empty">NO PHOTO REFERENCE YET</div><button type="button" onClick={() => pickLibraryPhoto(slotEntry.slot)}>SELECT FROM LIBRARY</button></>}<input ref={(node) => { fileInputRefs.current[slotEntry.slot] = node; }} type="file" accept="image/*" className="da-eater-file-fallback" onChange={(event) => handleFileFallback(slotEntry.slot, event)} /></div><textarea placeholder="PHOTO DESCRIPTION" value={slotEntry.description || ''} onChange={(e) => updatePhotoSlot(slotEntry.slot, { description: e.target.value })} /></div>)}</div><div className="da-eater-fixation-fields"><input placeholder="MEAL NAME" value={day.hyperFixationMeal?.mealName||''} onChange={(e)=>saveDay({...day,hyperFixationMeal:{...day.hyperFixationMeal,mealName:e.target.value}})} /><input placeholder="CURRENT FIXATION" value={day.hyperFixationMeal?.currentFixation||''} onChange={(e)=>saveDay({...day,hyperFixationMeal:{...day.hyperFixationMeal,currentFixation:e.target.value}})} /><input placeholder="TIMES THIS WEEK" value={day.hyperFixationMeal?.weeklyCount||''} onChange={(e)=>saveDay({...day,hyperFixationMeal:{...day.hyperFixationMeal,weeklyCount:e.target.value}})} /><textarea placeholder="NOTES" value={day.hyperFixationMeal?.notes||''} onChange={(e)=>saveDay({...day,hyperFixationMeal:{...day.hyperFixationMeal,notes:e.target.value}})} /><input placeholder="OPTIONAL MACRO ESTIMATE" value={day.hyperFixationMeal?.macroEstimate||''} onChange={(e)=>saveDay({...day,hyperFixationMeal:{...day.hyperFixationMeal,macroEstimate:e.target.value}})} /></div></> }] },
    { id: 'D', columns: 2, panels: [{ id: 'supps', token: 'medium', className: 'da-eater-panel', content: <><h2>THICC.SUPPS</h2><select value={suppForm.type} onChange={(e)=>setSuppForm({...suppForm,type:e.target.value})}>{SUP_TYPES.map((x)=><option key={x}>{x}</option>)}</select><input placeholder="NAME" value={suppForm.name} onChange={(e)=>setSuppForm({...suppForm,name:e.target.value})}/><input type="time" value={suppForm.time} onChange={(e)=>setSuppForm({...suppForm,time:e.target.value})}/><input placeholder="AMOUNT" value={suppForm.amount} onChange={(e)=>setSuppForm({...suppForm,amount:e.target.value})}/><select value={suppForm.unit} onChange={(e)=>setSuppForm({...suppForm,unit:e.target.value})}><option value="">UNIT</option>{supplementUnits.map((unit)=><option key={unit}>{unit}</option>)}</select><textarea placeholder="NOTES" value={suppForm.notes} onChange={(e)=>setSuppForm({...suppForm,notes:e.target.value})}/><button onClick={saveSupplement}>SAVE SUPPLEMENT</button>{(day.supplements||[]).map((s)=><div key={s.id} className="da-eater-list-row"><span>{s.type} • {s.name} • {s.amount}{s.unit}</span><button onClick={()=>setSuppForm(s)}>EDIT</button><button onClick={()=>setDay(deleteSupplementEntry(date,s.id))}>DELETE</button></div>)}</> }, { id: 'craving', token: 'medium', className: 'da-eater-panel da-eater-craving', content: <><h2>THICC.CRAVINGS</h2><input placeholder="CRAVING" value={cravingNotes.craving} onChange={(e)=>setCravingNotes({...cravingNotes,craving:e.target.value})}/><input placeholder="TRIGGER" value={cravingNotes.trigger} onChange={(e)=>setCravingNotes({...cravingNotes,trigger:e.target.value})}/><input placeholder="INTENSITY" value={cravingNotes.intensity} onChange={(e)=>setCravingNotes({...cravingNotes,intensity:e.target.value})}/><input placeholder="RESPONSE" value={cravingNotes.response} onChange={(e)=>setCravingNotes({...cravingNotes,response:e.target.value})}/><textarea className="da-eater-lined" placeholder="NOTES" value={cravingNotes.notes} onChange={(e)=>setCravingNotes({...cravingNotes,notes:e.target.value})}/><button onClick={()=>saveDay({...day,cravings:[...(day.cravings||[]),{...cravingNotes,id:Date.now().toString()}]})}>SAVE CRAVING</button></> }] },
    { id: 'E', columns: 1, panels: [{ id: 'cheat', token: 'medium', className: 'da-eater-panel da-eater-thicc-treat', content: <><h2>THICC.TREAT</h2><div className="da-eater-thicc-days">{THICC_DAYS.map((label) => <button type="button" key={label} className={`da-eater-thicc-day-pill ${selectedThiccDay === label ? 'is-active' : ''}`} onClick={() => selectThiccDay(label)}>{label}</button>)}</div><div className="da-eater-thicc-grid"><select value={cheatForm.type} onChange={(e)=>setCheatForm({...cheatForm,type:e.target.value})}>{CHEAT_TYPES.map((x)=><option key={x}>{x}</option>)}</select><input placeholder="SLUTTY MEAL" value={cheatForm.meal} onChange={(e)=>setCheatForm({...cheatForm,meal:e.target.value})}/><input placeholder="SLUTTY DESSERT" value={cheatForm.dessert} onChange={(e)=>setCheatForm({...cheatForm,dessert:e.target.value})}/><input placeholder="ROUGH CALORIES" value={cheatForm.roughCalories} onChange={(e)=>setCheatForm({...cheatForm,roughCalories:e.target.value})}/><select value={cheatForm.worthItPercent} onChange={(e)=>setCheatForm({...cheatForm,worthItPercent:e.target.value})}><option value="">WORTH IT %</option>{worthItOptions.map((option)=><option key={option.value} value={option.value}>{option.label}</option>)}</select><textarea placeholder="NOTES" value={cheatForm.notes} onChange={(e)=>setCheatForm({...cheatForm,notes:e.target.value})}/></div><button onClick={saveCheat}>SAVE CHEAT/FLEX</button>{(day.cheatFlexEntries||[]).map((c)=><div key={c.id} className="da-eater-list-row"><span>{c.type} • {c.day || 'WEDNESDAY'} • {c.meal}</span><button onClick={()=>{ setCheatForm(c); if (c.day && THICC_DAYS.includes(c.day)) selectThiccDay(c.day); }}>EDIT</button><button onClick={()=>setDay(deleteCheatFlexEntry(date,c.id))}>DELETE</button></div>)}</> }] }
  ];

  const panelById = Object.fromEntries(shelves.flatMap((shelf) => shelf.panels).map((panel) => [panel.id, panel.content]));
  const mealCalories = (day.meals || []).reduce((sum, meal) => sum + Number(meal.calories || 0), 0);
  const averageMealKcal = day.meals?.length ? Math.round(mealCalories / day.meals.length) : 0;
  const photoUrl = (entry) => {
    const ref = entry?.photoRef;
    if (typeof ref === 'string') return ref;
    return ref?.url || ref?.previewUrl || ref?.objectUrl || '';
  };
  const firstPhoto = photoLog.find((entry) => photoUrl(entry));
  const reupContent = (
    <div className="da-reup-panel">
      <div className="da-reup-head"><span>#</span><span>AMOUNT</span><span>S OR R</span><span>MEAL NAME</span></div>
      {reupRows.map((row, index) => (
        <div className="da-reup-row" key={index}>
          <span>{index + 1}</span>
          <input aria-label={`DA.REUP ROW ${index + 1} AMOUNT`} value={row.amount} onChange={(event) => updateReupRow(index, 'amount', event.target.value)} />
          <select aria-label={`DA.REUP ROW ${index + 1} S OR R`} value={row.status} onChange={(event) => updateReupRow(index, 'status', event.target.value)}><option value="">—</option><option value="S">S</option><option value="R">R</option></select>
          <input aria-label={`DA.REUP ROW ${index + 1} MEAL NAME`} value={row.mealName} onChange={(event) => updateReupRow(index, 'mealName', event.target.value)} />
        </div>
      ))}
    </div>
  );
  const macroSummary = (
    <div className="da-eater-summary-macros">
      {[['P','PROTEIN','protein','G'],['C','CARBS','carbs','G'],['F','FAT','fats','G'],['K','CALORIES','calories','KCAL'],['W','WATER','waterOz','OZ']].map(([symbol, label, key, unit]) => (
        <div key={key}>
          <span className="da-eater-macro-symbol" aria-hidden="true">{symbol}</span>
          <strong>{label}</strong>
          <i><b style={{ width: `${Math.min(totals.progress[key], 100)}%` }} /></i>
          <em>{totals.totals[key]} / {totals.targets[key]} {unit}</em>
        </div>
      ))}
    </div>
  );
  const tiles = [
    { id: 'macro-harvest', title: 'MACRO HARVEST', summary: 'TODAY’S LIVE PROGRESSION', media: macroSummary, content: panelById.macro },
    { id: 'thicc-eats', title: 'THICC.EATS', summary: `${day.meals?.length || 0} MEALS\nAVG MEAL ${averageMealKcal} KCAL`, content: panelById.meals, alwaysOpen: true },
    { id: 'thicc-obsession', title: 'THICC.OBSESSION', summary: `${day.hyperFixationMeal?.currentFixation || day.hyperFixationMeal?.mealName || 'FIXATION PENDING'}\n${day.hyperFixationMeal?.weeklyCount || 0} TIMES THIS WEEK`, media: firstPhoto ? <div className="da-eater-summary-photo" style={{ backgroundImage: `url(${JSON.stringify(photoUrl(firstPhoto)).slice(1, -1)})` }} aria-hidden="true" /> : <div className="da-eater-summary-photo is-empty" aria-hidden="true">PHOTO</div>, content: panelById['fixation-photo-log'] },
    { id: 'thicc-supps', title: 'THICC.SUPPS', summary: `${day.supplements?.length || 0} TODAY`, content: panelById.supps },
    { id: 'thicc-cravings', title: 'THICC.CRAVINGS', summary: `${day.cravings?.length || 0} ACTIVE`, content: panelById.craving },
    { id: 'thicc-treat', title: 'THICC.TREAT', summary: `${day.cheatFlexEntries?.length || 0} THIS WEEK\n${selectedThiccDay}`, content: panelById.cheat },
    { id: 'da-reup', title: 'DA.REUP', summary: `${reupRows.filter((row) => row.amount || row.status || row.mealName).length} OF 10 ROWS`, content: reupContent },
  ];

  return (
    <SectionShell className="da-eater-shell">
      <ScenePlate>
        <div className="da-eater-bg" />
        <svg className="da-eater-orchard-swirls" viewBox="0 0 1280 720" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="da-eater-swirl-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#b98a4f" stopOpacity="0" />
              <stop offset=".26" stopColor="#f2d69e" stopOpacity=".86" />
              <stop offset=".72" stopColor="#c99754" stopOpacity=".76" />
              <stop offset="1" stopColor="#f7dfac" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="da-eater-swirl-nude" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d78e93" stopOpacity="0" />
              <stop offset=".28" stopColor="#efb3ad" stopOpacity=".78" />
              <stop offset=".75" stopColor="#c98283" stopOpacity=".7" />
              <stop offset="1" stopColor="#efb3ad" stopOpacity="0" />
            </linearGradient>
            <filter id="da-eater-swirl-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <g className="da-eater-swirl da-eater-swirl--upper" filter="url(#da-eater-swirl-glow)">
            <path d="M826 86 C902 34 984 92 932 142 C899 174 843 138 865 106 C884 78 927 96 918 121" />
            <path d="M856 151 C906 183 987 157 1014 111 C1033 79 1024 53 1001 40" />
          </g>
          <g className="da-eater-swirl da-eater-swirl--right" filter="url(#da-eater-swirl-glow)">
            <path d="M930 300 C1000 259 1128 275 1147 325 C1161 363 1104 384 1077 350 C1056 324 1092 301 1117 318" />
            <path d="M953 462 C1019 425 1124 440 1162 490 C1198 537 1150 579 1103 554 C1064 533 1084 488 1120 493" />
            <path d="M966 487 C925 520 925 560 964 577" />
          </g>
          <g className="da-eater-swirl da-eater-swirl--lower" filter="url(#da-eater-swirl-glow)">
            <path d="M432 588 C505 548 590 578 572 626 C557 665 494 653 500 617 C504 590 542 586 554 609" />
            <path d="M592 650 C664 694 782 670 792 613 C799 574 761 553 730 573 C703 591 720 626 749 619" />
            <path d="M790 612 C839 582 898 599 918 637" />
          </g>
        </svg>
      </ScenePlate>
      <FloatingCrystalTileDeck className="da-eater-floating-deck" tiles={tiles} ariaLabel="DA.EATER orchard stations" />
    </SectionShell>
  );
}
