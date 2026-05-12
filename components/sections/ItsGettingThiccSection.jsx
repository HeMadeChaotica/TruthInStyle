'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/its-getting-thicc.css';
import '../../styles/sections/universal-frame.css';
import { optionRegistry } from '../../lib/dropdowns/optionRegistry';
import { addClient, appendLog, loadClients, readMedia, saveClients, upsertMedia } from '../../src/services/itsGettingThiccService';
import { ArtLane, BlueprintStack, ContentScroller, ScenePlate, SectionOverlay, SectionShell } from '../shared/UniversalSectionFrame';

const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const tabs = ['THICC.INFO', 'THICC.PEOPLE', 'THICC.FORMS', 'THICC.TIME'];

export default function ItsGettingThiccSection() {
  const [clients, setClients] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [activeTab, setActiveTab] = useState('THICC.INFO');
  const [forms, setForms] = useState([{ id: 'intake', formName: 'INTAKE DOSSIER', formCategory: 'OPERATIONS', active: true }]);
  const [assignments, setAssignments] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const active = useMemo(() => clients.find((c) => c.id === activeId) || clients[0], [clients, activeId]);

  useEffect(() => {
    const seeded = loadClients();
    setClients(seeded);
    setActiveId(seeded[0]?.id || '');
  }, []);

  const persist = (next, event = 'autosave') => {
    setClients(next);
    saveClients(next);
    appendLog(event, { activeId });
  };

  const update = (key, value) => {
    if (!active) return;
    const next = clients.map((c) => (c.id === active.id ? { ...c, [key]: value } : c));
    persist(next, `field:${key}`);
  };

  const updateArray = (key, i, value) => update(key, (active[key] || []).map((v, idx) => (idx === i ? value : v)));

  const onUpload = (slot) => (e) => {
    const f = e.target.files?.[0];
    if (!f || !active) return;
    const fr = new FileReader();
    fr.onload = () => {
      const dataUrl = upsertMedia(active.id, slot, fr.result);
      if (slot === 'photo') update('photo', dataUrl);
      else updateArray('celebration', Number(slot), dataUrl);
    };
    fr.readAsDataURL(f);
  };

  if (!active) return null;
  const glancePhoto = active.photo || readMedia(active.id, 'photo');

  const infoShelves = [
    { id: 'A', columns: 1, panels: [{ id: 'identity', token: 'tall', content: <Identity /> }] },
    { id: 'B', columns: 2, panels: [{ id: 'body', token: 'standard', content: <Body /> }, { id: 'glance', token: 'standard', content: <Glance /> }] },
    { id: 'C', columns: 1, panels: [{ id: 'food', token: 'tall', content: <Food /> }] },
    { id: 'D', columns: 2, panels: [{ id: 'move', token: 'tall', content: <Movement /> }, { id: 'med', token: 'tall', content: <Medical /> }] },
    { id: 'E', columns: 2, panels: [{ id: 'macro', token: 'standard', content: <Macro /> }, { id: 'juice', token: 'standard', content: <Juice /> }, { id: 'season', token: 'compact', content: <Season /> }, { id: 'ref', token: 'standard', content: <Referrals /> }] },
    { id: 'F', columns: 1, panels: [{ id: 'tr', token: 'tall', content: <TrainingRest /> }, { id: 'split', token: 'tall', content: <Split /> }] },
    { id: 'G', columns: 2, panels: [{ id: 'event', token: 'standard', content: <Events /> }, { id: 'pay', token: 'standard', content: <Payment /> }] },
    { id: 'H', columns: 2, panels: [{ id: 'thoughts', token: 'standard', content: <Thoughts /> }, { id: 'check', token: 'standard', content: <Checkin /> }] },
    { id: 'I', columns: 1, panels: [{ id: 'cele', token: 'tall', content: <Celebration /> }] },
  ];

  function Identity() { return <><h3>CLIENT IDENTITY</h3><label className="upload">{glancePhoto ? <img src={glancePhoto} alt="client" /> : 'PHOTO UPLOAD FROM LIBRARY'}<input type="file" accept="image/*" onChange={onUpload('photo')} /></label>{['name', 'id', 'phone', 'sex', 'sexualOrientation', 'height', 'age', 'email'].map((k) => <label key={k}>{k.toUpperCase()}<input value={active[k] || ''} onChange={(e) => update(k, e.target.value)} /></label>)}<label>MARRIED / SINGLE<select value={active.relationshipStatus || ''} onChange={(e) => update('relationshipStatus', e.target.value)}>{optionRegistry.itsGettingThicc.marriedSingle.map((o) => <option key={o}>{o}</option>)}</select></label><label>CLIENT COLOR<select value={active.clientColorOptionKey || ''} onChange={(e) => update('clientColorOptionKey', e.target.value)}>{optionRegistry.itsGettingThicc.clientColors.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select></label></>; }
  function Body() { return <><h3>BODY / GOAL</h3>{['currentWeight', 'goalWeight', 'currentBmi', 'goalBmi'].map((k) => <label key={k}>{k.toUpperCase()}<input value={active[k] || ''} onChange={(e) => update(k, e.target.value)} /></label>)}</>; }
  function Glance() { return <><h3>AT A GLANCE</h3>{glancePhoto && <img src={glancePhoto} className="thumb" alt="preview" />}<p>HEIGHT {active.height}</p><p>CURRENT WEIGHT {active.currentWeight}</p><p>GOAL WEIGHT {active.goalWeight}</p><p>CURRENT BMI {active.currentBmi}</p><p>GOAL BMI {active.goalBmi}</p></>; }
  function Food() { return <><h3>FOOD: THE GOOD, THE BAD & THE “I DESERVE THIS”</h3>{[1, 2, 3, 4, 5].map((n) => <label key={n}>PROMPT {n}<textarea value={active[`food${n}`] || ''} onChange={(e) => update(`food${n}`, e.target.value)} /></label>)}</>; }
  function Movement() { return <><h3>MOVEMENT: THE MEASURE AND THE PRESSURES</h3>{[1, 2, 3, 4].map((n) => <label key={n}>PROMPT {n}<textarea value={active[`move${n}`] || ''} onChange={(e) => update(`move${n}`, e.target.value)} /></label>)}<label>SELECT CURRENT OVERALL LEVEL OF ACTIVITY<select value={active.activity || ''} onChange={(e) => update('activity', e.target.value)}>{optionRegistry.itsGettingThicc.activityLevel.map((o) => <option key={o}>{o}</option>)}</select></label></>; }
  function Medical() { return <><h3>MEDICAL ADVISORY</h3>{['emergencyContact', 'injuries', 'surgeries', 'allergies', 'medications', 'limits', 'painfulMovements', 'flexibility', 'hardNos', 'trainingFears'].map((k) => <label key={k}>{k.toUpperCase()}<textarea value={active[k] || ''} onChange={(e) => update(k, e.target.value)} /></label>)}</>; }
  function Macro() { return <><h3>MACRO TARGETS</h3><div className="inline-macro">{['PROTEIN', 'CARBS', 'FATS', 'WATER', 'CALORIES'].map((k) => <label key={k}>{k}<input value={active[`macro_${k.toLowerCase()}`] || ''} onChange={(e) => update(`macro_${k.toLowerCase()}`, e.target.value)} /></label>)}</div></>; }
  function Juice() { return <><h3>DA.JUICE MIRROR</h3>{['substance', 'amount', 'cycle', 'location', 'notes'].map((k) => <label key={k}>{k.toUpperCase()}<input value={active[`juice_${k}`] || ''} onChange={(e) => update(`juice_${k}`, e.target.value)} /></label>)}</>; }
  function Season() { return <><h3>SEASONS PER WEEK</h3><input type="number" value={active.seasonsPerWeek || ''} onChange={(e) => update('seasonsPerWeek', e.target.value)} /></>; }
  function Referrals() { return <><h3>REFERRAL TRACKER</h3><button onClick={() => update('referrals', [...(active.referrals || []), { name: '', date: '', status: '', notes: '' }])}>ADD REFERRAL</button></>; }
  const Seven = ({ k, choices }) => <div className="hz">{days.map((d, i) => <label key={d}>{d}<select value={active[k]?.[i] || choices[0]} onChange={(e) => updateArray(k, i, e.target.value)}>{choices.map((o) => <option key={o}>{o}</option>)}</select></label>)}</div>;
  function TrainingRest() { return <><h3>TRAINING / REST CALENDAR</h3><Seven k="trainingRest" choices={optionRegistry.itsGettingThicc.trainingRest} /></>; }
  function Split() { return <><h3>CURRENT EXERCISE PROGRAM SPLIT</h3><Seven k="programSplit" choices={optionRegistry.itsGettingThicc.programSplit} /></>; }
  function Events() { return <><h3>UPCOMING TRAINING FOCUS EVENTS</h3><textarea value={active.eventNotes || ''} onChange={(e) => update('eventNotes', e.target.value)} /></>; }
  function Payment() { return <><h3>PAYMENT</h3><input type="date" value={active.paymentDate || ''} onChange={(e) => update('paymentDate', e.target.value)} /></>; }
  function Thoughts() { return <><h3>THICC THOUGHTS</h3><textarea className="big" value={active.thoughts || ''} onChange={(e) => update('thoughts', e.target.value)} /></>; }
  function Checkin() { return <><h3>MYFITFOODS CHECK-IN</h3><label>HOW MANY MEALS WEEKLY<input value={active.myfitMeals || ''} onChange={(e) => update('myfitMeals', e.target.value)} /></label><label>VERIFY WITH ANTHONY THEY ARE LOGGED<select value={String(active.myfitVerified || false)} onChange={(e) => update('myfitVerified', e.target.value === 'true')}><option value="false">NO</option><option value="true">YES</option></select></label></>; }
  function Celebration() { return <><h3>CELEBRATION MOMENTS</h3><div className="cele">{(active.celebration || []).slice(0, 10).map((img, i) => <label key={i} className="slot">{img ? <img src={img} alt="" /> : `${i + 1}`}<input type="file" accept="image/*" onChange={onUpload(String(i))} /><button className="inline-del" onClick={(e) => { e.preventDefault(); updateArray('celebration', i, ''); }}>×</button></label>)}</div></>; }

  const peopleShelves = [{ id: 'people', columns: 1, panels: [{ id: 'p1', token: 'tall', content: <><h3>THICC.PEOPLE</h3><div className="people-list">{clients.map((c) => <button key={c.id} className="people-item" style={{ borderLeftColor: c.clientColorValue || '#91a7ff' }} onClick={() => { setActiveId(c.id); setActiveTab('THICC.INFO'); }}><span>{c.name}</span><span>{c.id}</span><span>{c.active === false ? 'INACTIVE' : 'ACTIVE'}</span></button>)}</div></> }] }];
  const formsShelves = [{ id: 'forms', columns: 1, panels: [{ id: 'f1', token: 'tall', content: <><h3>THICC.FORMS</h3>{forms.map((f) => <div key={f.id}>{f.formName} · {f.formCategory}</div>)}<button onClick={() => setAssignments([...assignments, { id: Date.now(), clientId: active.id, formId: forms[0].id, status: 'assigned', response_json: {}, notes: '' }])}>ASSIGN FORM TO CLIENT</button><p>ASSIGNMENTS {assignments.length}</p></> }] }];
  const timeShelves = [{ id: 'time', columns: 1, panels: [{ id: 't1', token: 'tall', content: <><h3>THICC.TIME</h3><div className="month">{Array.from({ length: 35 }).map((_, i) => <div key={i} className="day">{i + 1 <= 31 ? i + 1 : ''}</div>)}</div><button onClick={() => setCalendar([...calendar, { id: Date.now(), client_id: active.id, entry_type: 'client', entry_date: new Date().toISOString().slice(0, 10), color_option_key: active.clientColorOptionKey || 'cobalt' }])}>ADD ENTRY</button><p>ENTRIES {calendar.length}</p></> }] }];

  const shelves = activeTab === 'THICC.INFO' ? infoShelves : activeTab === 'THICC.PEOPLE' ? peopleShelves : activeTab === 'THICC.FORMS' ? formsShelves : timeShelves;

  return <SectionShell className="igtv2-page"><ScenePlate><div className="igtv2-bg" /><div className="igtv2-shade" /></ScenePlate><SectionOverlay><ArtLane className="igtv2-left"><div className="igtv2-glyph">ITS</div>{tabs.map((tab) => <button key={tab} className={`igtv2-cabinet-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}<button className="igtv2-cabinet-btn" onClick={() => { const fresh = addClient(); const next = [...clients, fresh]; persist(next, 'new-client'); setActiveId(fresh.id); setActiveTab('THICC.INFO'); }}>NEW CLIENT</button></ArtLane><ContentScroller><BlueprintStack shelves={shelves} /></ContentScroller></SectionOverlay></SectionShell>;
}
