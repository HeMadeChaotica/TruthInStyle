'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/sections/universal-frame.css';
import '../../styles/sections/da-eater.css';
import { ArtLane, BlueprintStack, ContentScroller, ScenePlate, SectionOverlay, SectionShell } from '../shared/UniversalSectionFrame';
import { calculateDaEaterTotals, deleteCheatFlexEntry, deleteMealEntry, deleteSupplementEntry, formatDisplayDate, getDaEaterDay, saveDaEaterDay, upsertCheatFlexEntry, upsertMealEntry, upsertSupplementEntry } from '../../src/services/daEaterService';

const today = () => new Date().toISOString().slice(0, 10);
const MEAL_TYPES = ['BREAKFAST','LUNCH','DINNER','SNACK','PRE-WORKOUT','POST-WORKOUT','TREAT','DRINK','LATE NIGHT','OTHER'];
const SUP_TYPES = ['VITAMIN','MINERAL','PROTEIN','CREATINE','ELECTROLYTE','DIGESTIVE','PRE-WORKOUT','POST-WORKOUT','OTHER'];
const CHEAT_TYPES = ['CHEAT MEAL','FLEX MEAL','TREAT','REFEED','DATE NIGHT','SOCIAL MEAL','CELEBRATION','OTHER'];
const THICC_DAYS = ['WEDNESDAY', 'SATURDAY'];
const THICC_DAY_STORAGE_KEY = 'truthinstyle_da_eater_thicc_treat_day_v1';

export default function DaEaterSection() {
  const [date, setDate] = useState(today());
  const [day, setDay] = useState(() => getDaEaterDay(today()));
  const [mealForm, setMealForm] = useState({ id: '', type: 'BREAKFAST', name: '', time: '', protein: '', carbs: '', fats: '', calories: '' });
  const [suppForm, setSuppForm] = useState({ id: '', type: 'VITAMIN', name: '', time: '', amount: '', unit: '', notes: '' });
  const [cheatForm, setCheatForm] = useState({ id: '', type: 'CHEAT MEAL', day: '', meal: '', dessert: '', roughCalories: '', worthItPercent: '', notes: '' });
  const [cravingNotes, setCravingNotes] = useState({ craving: '', trigger: '', intensity: '', response: '', notes: '' });
  const fileInputRefs = useRef({});

  const saveDay = (next) => { const saved = saveDaEaterDay(next); setDay(saved); };
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
  }, [dayName]);
  const photoLog = day.photoLog || [];
  const mediaLibraryApi = typeof window !== 'undefined' ? (window.media_library || window.mediaLibrary || window.MediaLibrary || null) : null;
  const hasNativePicker = typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function';
  const mediaLibraryAvailable = Boolean(mediaLibraryApi || hasNativePicker);

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
      fileInputRefs.current[slot]?.click();
    } catch (error) {
      console.warn('DA.EATER photo pick failed', error);
    }
  };

  const handleFileFallback = (slot, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    updatePhotoSlot(slot, {
      photoRef: { source: 'browser_file_input', name: file.name, type: file.type, size: file.size, lastModified: file.lastModified },
      description: day.photoLog?.find((x) => x.slot === slot)?.description || ''
    });
  };

  const saveMeal = () => { const next = upsertMealEntry(date, mealForm); setDay(next); setMealForm({ id: '', type: 'BREAKFAST', name: '', time: '', protein: '', carbs: '', fats: '', calories: '' }); };
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
    { id: 'B', columns: 1, panels: [{ id: 'meals', token: 'medium', className: 'da-eater-panel', content: <><h2>MEAL LOG</h2><div className="da-eater-meal-log-layout"><div className="da-eater-meal-input-stack"><select value={mealForm.type} onChange={(e)=>setMealForm({...mealForm,type:e.target.value})}>{MEAL_TYPES.map((x)=><option key={x}>{x}</option>)}</select><input placeholder="MEAL NAME" value={mealForm.name} onChange={(e)=>setMealForm({...mealForm,name:e.target.value})}/><input type="time" value={mealForm.time} onChange={(e)=>setMealForm({...mealForm,time:e.target.value})}/><input placeholder="PROTEIN" value={mealForm.protein} onChange={(e)=>setMealForm({...mealForm,protein:e.target.value})}/><input placeholder="CARBS" value={mealForm.carbs} onChange={(e)=>setMealForm({...mealForm,carbs:e.target.value})}/><input placeholder="FATS" value={mealForm.fats} onChange={(e)=>setMealForm({...mealForm,fats:e.target.value})}/><input placeholder="CALORIES" value={mealForm.calories} onChange={(e)=>setMealForm({...mealForm,calories:e.target.value})}/><button onClick={saveMeal}>SAVE MEAL</button></div><div className="da-eater-meal-saved-list"><h3>SAVED MEALS</h3>{(day.meals||[]).length===0 ? <p className="da-eater-empty">NO SAVED MEALS YET.</p> : (day.meals||[]).map((m)=><div key={m.id} className="da-eater-meal-card"><div className="da-eater-meal-card-main"><strong>{m.type} • {m.name || 'UNTITLED'}</strong><span>{m.time || 'TIME NOT SET'}</span><div className="da-eater-meal-macros"><span>P {m.protein || 0}</span><span>C {m.carbs || 0}</span><span>F {m.fats || 0}</span><span>KCAL {m.calories || 0}</span></div></div><div className="da-eater-meal-controls"><button onClick={()=>setMealForm(m)}>EDIT</button><button onClick={()=>setDay(deleteMealEntry(date,m.id))}>DELETE</button></div></div>)}</div></div></> }] },
    { id: 'C', columns: 1, panels: [{ id: 'fixation-photo-log', token: 'medium', className: 'da-eater-panel da-eater-fixation-log', content: <><h2>FIXATION PHOTO LOG</h2><p className="da-eater-subtle-note">{mediaLibraryAvailable ? 'LIBRARY READY • PICK OR REPLACE PHOTOS' : 'LIBRARY ACCESS ISN’T DETECTED HERE, BUT YOU CAN STILL ADD IMAGE REFERENCES.'}</p><div className="da-eater-photo-grid">{photoLog.map((slotEntry) => <div className="da-eater-photo-slot" key={slotEntry.slot}><div className="da-eater-photo-head"><strong>PHOTO {slotEntry.slot}</strong><span>{formatDisplayDate(date)} • DA.EATER</span></div><div className="da-eater-photo-body">{slotEntry.photoRef ? <><div className="da-eater-photo-ref">SELECTED: {typeof slotEntry.photoRef === 'string' ? slotEntry.photoRef : (slotEntry.photoRef.name || 'LIBRARY_MEDIA_REFERENCE')}</div><div className="da-eater-photo-actions"><button type="button" onClick={() => pickLibraryPhoto(slotEntry.slot)}>REPLACE</button><button type="button" onClick={() => updatePhotoSlot(slotEntry.slot, { photoRef: '' })}>REMOVE</button></div></> : <><div className="da-eater-photo-empty">NO PHOTO REFERENCE YET</div><button type="button" onClick={() => pickLibraryPhoto(slotEntry.slot)}>SELECT FROM LIBRARY</button></>}<input ref={(node) => { fileInputRefs.current[slotEntry.slot] = node; }} type="file" accept="image/*" className="da-eater-file-fallback" onChange={(event) => handleFileFallback(slotEntry.slot, event)} /></div><textarea placeholder="PHOTO DESCRIPTION" value={slotEntry.description || ''} onChange={(e) => updatePhotoSlot(slotEntry.slot, { description: e.target.value })} /></div>)}</div><div className="da-eater-fixation-fields"><input placeholder="MEAL NAME" value={day.hyperFixationMeal?.mealName||''} onChange={(e)=>saveDay({...day,hyperFixationMeal:{...day.hyperFixationMeal,mealName:e.target.value}})} /><input placeholder="CURRENT FIXATION" value={day.hyperFixationMeal?.currentFixation||''} onChange={(e)=>saveDay({...day,hyperFixationMeal:{...day.hyperFixationMeal,currentFixation:e.target.value}})} /><input placeholder="TIMES THIS WEEK" value={day.hyperFixationMeal?.weeklyCount||''} onChange={(e)=>saveDay({...day,hyperFixationMeal:{...day.hyperFixationMeal,weeklyCount:e.target.value}})} /><textarea placeholder="NOTES" value={day.hyperFixationMeal?.notes||''} onChange={(e)=>saveDay({...day,hyperFixationMeal:{...day.hyperFixationMeal,notes:e.target.value}})} /><input placeholder="OPTIONAL MACRO ESTIMATE" value={day.hyperFixationMeal?.macroEstimate||''} onChange={(e)=>saveDay({...day,hyperFixationMeal:{...day.hyperFixationMeal,macroEstimate:e.target.value}})} /></div></> }] },
    { id: 'D', columns: 2, panels: [{ id: 'supps', token: 'medium', className: 'da-eater-panel', content: <><h2>SUPPLEMENT TRACKING</h2><select value={suppForm.type} onChange={(e)=>setSuppForm({...suppForm,type:e.target.value})}>{SUP_TYPES.map((x)=><option key={x}>{x}</option>)}</select><input placeholder="NAME" value={suppForm.name} onChange={(e)=>setSuppForm({...suppForm,name:e.target.value})}/><input type="time" value={suppForm.time} onChange={(e)=>setSuppForm({...suppForm,time:e.target.value})}/><input placeholder="AMOUNT" value={suppForm.amount} onChange={(e)=>setSuppForm({...suppForm,amount:e.target.value})}/><input placeholder="UNIT" value={suppForm.unit} onChange={(e)=>setSuppForm({...suppForm,unit:e.target.value})}/><textarea placeholder="NOTES" value={suppForm.notes} onChange={(e)=>setSuppForm({...suppForm,notes:e.target.value})}/><button onClick={saveSupplement}>SAVE SUPPLEMENT</button>{(day.supplements||[]).map((s)=><div key={s.id} className="da-eater-list-row"><span>{s.type} • {s.name} • {s.amount}{s.unit}</span><button onClick={()=>setSuppForm(s)}>EDIT</button><button onClick={()=>setDay(deleteSupplementEntry(date,s.id))}>DELETE</button></div>)}</> }, { id: 'craving', token: 'medium', className: 'da-eater-panel da-eater-craving', content: <><h2>CRAVINGS</h2><input placeholder="CRAVING" value={cravingNotes.craving} onChange={(e)=>setCravingNotes({...cravingNotes,craving:e.target.value})}/><input placeholder="TRIGGER" value={cravingNotes.trigger} onChange={(e)=>setCravingNotes({...cravingNotes,trigger:e.target.value})}/><input placeholder="INTENSITY" value={cravingNotes.intensity} onChange={(e)=>setCravingNotes({...cravingNotes,intensity:e.target.value})}/><input placeholder="RESPONSE" value={cravingNotes.response} onChange={(e)=>setCravingNotes({...cravingNotes,response:e.target.value})}/><textarea className="da-eater-lined" placeholder="NOTES" value={cravingNotes.notes} onChange={(e)=>setCravingNotes({...cravingNotes,notes:e.target.value})}/><button onClick={()=>saveDay({...day,cravings:[...(day.cravings||[]),{...cravingNotes,id:Date.now().toString()}]})}>SAVE CRAVING</button></> }] },
    { id: 'E', columns: 1, panels: [{ id: 'cheat', token: 'medium', className: 'da-eater-panel da-eater-thicc-treat', content: <><h2>THICC.TREAT</h2><p className="da-eater-thicc-subtitle">WEDNESDAY / SATURDAY</p><div className="da-eater-thicc-days">{THICC_DAYS.map((label) => <button type="button" key={label} className={`da-eater-thicc-day-pill ${selectedThiccDay === label ? 'is-active' : ''}`} onClick={() => selectThiccDay(label)}>{label}</button>)}</div><div className="da-eater-thicc-grid"><select value={cheatForm.type} onChange={(e)=>setCheatForm({...cheatForm,type:e.target.value})}>{CHEAT_TYPES.map((x)=><option key={x}>{x}</option>)}</select><input placeholder="SLUTTY MEAL" value={cheatForm.meal} onChange={(e)=>setCheatForm({...cheatForm,meal:e.target.value})}/><input placeholder="SLUTTY DESSERT" value={cheatForm.dessert} onChange={(e)=>setCheatForm({...cheatForm,dessert:e.target.value})}/><input placeholder="ROUGH CALORIES" value={cheatForm.roughCalories} onChange={(e)=>setCheatForm({...cheatForm,roughCalories:e.target.value})}/><input placeholder="WORTH IT %" value={cheatForm.worthItPercent} onChange={(e)=>setCheatForm({...cheatForm,worthItPercent:e.target.value})}/><textarea placeholder="NOTES" value={cheatForm.notes} onChange={(e)=>setCheatForm({...cheatForm,notes:e.target.value})}/></div><button onClick={saveCheat}>SAVE CHEAT/FLEX</button>{(day.cheatFlexEntries||[]).map((c)=><div key={c.id} className="da-eater-list-row"><span>{c.type} • {c.day || 'WEDNESDAY'} • {c.meal}</span><button onClick={()=>{ setCheatForm(c); if (c.day && THICC_DAYS.includes(c.day)) selectThiccDay(c.day); }}>EDIT</button><button onClick={()=>setDay(deleteCheatFlexEntry(date,c.id))}>DELETE</button></div>)}</> }] }
  ];

  return <SectionShell className="da-eater-shell"><ScenePlate><div className="da-eater-bg" /></ScenePlate><SectionOverlay><ArtLane className="da-eater-left" /><ContentScroller className="da-eater-content"><BlueprintStack shelves={shelves} /></ContentScroller></SectionOverlay></SectionShell>;
}
