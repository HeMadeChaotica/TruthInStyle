'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/its-getting-thicc.css';
import '../../styles/sections/universal-frame.css';
import { optionRegistry } from '../../lib/dropdowns/optionRegistry';
import {
  appendLog, deleteScheduleEntry, fetchClientColors, fetchFormAssignments, fetchForms, fetchScheduleEntries, loadClients, readMedia, resolveClientColor,
  saveClients, upsertFormAssignment, upsertMedia, upsertScheduleEntry, getClientDbId, isSupabaseEnabled, ensureClientDbId,
} from '../../src/services/itsGettingThiccService';
import { ArtLane, BlueprintStack, ContentScroller, ScenePlate, SectionOverlay, SectionShell } from '../shared/UniversalSectionFrame';

const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const tabs = ['THICC.INFO', 'THICC.PEOPLE', 'THICC.FORMS', 'THICC.TIME', 'THICC.NOMO'];
const foodPrompts = ['WHAT DO YOU STRUGGLE THE HARDEST TO STAY AWAY FROM', 'WHEN DO YOU USUALLY REACH FOR IT (TIME, MOOD, SITUATION)', 'GROWING UP, WERE YOU FORCED TO FINISH YOUR PLATE, AND HOW HAS THAT AFFECTED YOUR EATING HABITS IN ADULTHOOD?', 'WERE THERE FOOD RULES, PUNISHMENTS, PRESSURE, OR EMOTIONALLY CHARGED EXPERIENCES AROUND EATING GROWING UP THAT STILL AFFECT HOW YOU EAT NOW?', 'HOW DO YOUR EMOTIONS AND FOOD INTERACT TODAY'];
const movementPrompts = ['WALK ME THROUGH A TYPICAL DAY OF EATING', 'WALK ME THROUGH A NORMAL DAY IN YOUR BODY', 'HOW MUCH OF YOUR DAY IS SITTING VS ACTUALLY MOVING', 'WHEN DO YOU FEEL MOST PHYSICALLY ALIVE'];
const medicalPrompts = ['EMERGENCY CONTACT NAME / NUMBER', 'PAST / CURRENT INJURIES', 'PAST / UPCOMING SURGERIES', 'RECURRING SEASONAL ISSUES / ALLERGIES', 'MEDICATIONS THAT COULD CAUSE COMPLICATIONS, LIKE BLOOD PRESSURE MEDS', 'PHYSICAL LIMITATIONS', 'MOVEMENTS THAT CAUSE PAIN', 'LEVEL OF FLEXIBILITY, RANGE FROM RIGAMORTUS TO SIMONE BILES WISHES', 'HARD NO’S', 'TRAINING FEARS'];

export default function ItsGettingThiccSection() {
  const [clients, setClients] = useState([]); const [activeId, setActiveId] = useState(''); const [activeTab, setActiveTab] = useState('THICC.INFO');
  const [forms, setForms] = useState([]); const [assignments, setAssignments] = useState([]); const [calendar, setCalendar] = useState([]); const [colorMap, setColorMap] = useState([]);
  const [formsError, setFormsError] = useState(''); const [timeError, setTimeError] = useState('');
  const [scheduleType, setScheduleType] = useState('client');
  const active = useMemo(() => clients.find((c) => c.id === activeId) || clients[0], [clients, activeId]);
  const activeClientDbId = useMemo(() => getClientDbId(active), [active]);

  useEffect(() => { const seeded = loadClients(); setClients(seeded); setActiveId(seeded[0]?.id || ''); fetchScheduleEntries().then(setCalendar); fetchClientColors().then(setColorMap); fetchForms().then(setForms); fetchFormAssignments().then(setAssignments); }, []);
  const persist = (next, event = 'autosave') => { setClients(next); saveClients(next); appendLog(event, { activeId }); };
  const update = (key, value) => { if (!active) return; persist(clients.map((c) => (c.id === active.id ? { ...c, [key]: value } : c)), `field:${key}`); };
  const updateArray = (key, i, value) => update(key, (active[key] || []).map((v, idx) => (idx === i ? value : v)));
  const onUpload = (slot) => (e) => { const f = e.target.files?.[0]; if (!f || !active) return; const fr = new FileReader(); fr.onload = () => { const d = upsertMedia(active.id, slot, fr.result); if (slot === 'photo') update('photo', d); else update('celebration', (active.celebration || []).map((t, i) => (i === Number(slot) ? { ...t, media: d } : t))); }; fr.readAsDataURL(f); };

  const highlightPhoto = active?.livingThiccPhoto || (active ? readMedia(active.id, 'livingThiccPhoto') : '');

  function Food() { return <><h3>FOOD: THE GOOD, THE BAD & THE “I DESERVE THIS”</h3>{foodPrompts.map((p, i) => <label key={p}>{`${i + 1}. ${p}`}<textarea value={active[`food${i + 1}`] || ''} onChange={(e) => update(`food${i + 1}`, e.target.value)} /></label>)}</>; }
  function Movement() { return <><h3>MOVEMENT: THE MEASURE AND THE PRESSURES</h3>{movementPrompts.map((p, i) => <label key={p}>{`${i + 1}. ${p}`}{i === 1 && <small>THINK WORK, ERRANDS, SITTING, STANDING, STEPS, STRESS, AND HOW OFTEN YOUR BODY IS ACTUALLY IN MOTION, NOT JUST HOW OFTEN YOU MEANT TO WORK OUT.</small>}<textarea value={active[`move${i + 1}`] || ''} onChange={(e) => update(`move${i + 1}`, e.target.value)} /></label>)}<label>5. SELECT CURRENT OVERALL LEVEL OF ACTIVITY<select value={active.activity || 'SEDENTARY'} onChange={(e) => update('activity', e.target.value)}>{['SEDENTARY', 'LIGHTLY', 'MODERATELY', 'ACTIVE', 'I DO THIS S@$&!', 'I SWEAR I’M ACTIVE BUT MY APPLE WATCH SAYS OTHERWISE'].map((o) => <option key={o}>{o}</option>)}</select></label></>; }
  function Medical() { const keys=['emergencyContact','injuries','surgeries','allergies','medications','limits','painfulMovements','flexibility','hardNos','trainingFears']; return <><h3>MEDICAL ADVISORY</h3>{medicalPrompts.map((p, i) => <label key={p}>{`${i + 1}. ${p}`}<textarea value={active[keys[i]] || ''} onChange={(e) => update(keys[i], e.target.value)} /></label>)}</>; }

  const [editorMode, setEditorMode] = useState('new');
  const [editingEntryId, setEditingEntryId] = useState('');
  const [editingEntryOwner, setEditingEntryOwner] = useState(null);
  const [entryForm, setEntryForm] = useState({ entry_type: 'client', entry_date: '', start_time: '09:00', end_time: '10:00', workout_label: '', location: '', notes: '' });

  const resetEntryForm = () => {
    const now = new Date();
    setEditorMode('new');
    setEditingEntryId('');
    setEditingEntryOwner(null);
    setEntryForm({
      entry_type: scheduleType,
      entry_date: now.toISOString().slice(0, 10),
      start_time: '09:00',
      end_time: '10:00',
      workout_label: active?.programSplit?.[now.getDay()] || (scheduleType === 'personal' ? 'PERSONAL' : 'SESSION'),
      location: '',
      notes: '',
    });
  };

  const openEditor = (row) => {
    setEditorMode('edit');
    setEditingEntryId(row.id);
    setEditingEntryOwner({
      client_id: row.client_id ?? null,
      client_name: row.client_name || '',
      color_option_key: row.color_option_key || '',
    });
    setEntryForm({
      entry_type: row.entry_type || 'client',
      entry_date: row.entry_date || '',
      start_time: row.start_time || '09:00',
      end_time: row.end_time || '10:00',
      workout_label: row.workout_label || '',
      location: row.location || '',
      notes: row.notes || '',
    });
  };

  useEffect(() => { resetEntryForm(); }, [scheduleType, activeId]);

  if (!active) return null;

  const infoShelves = [
    { id: 'infoA', columns: 2, panels: [{ id: 'i1', token: 'medium', content: <><h3>THICC.INFO</h3><label>CLIENT NAME<input value={active.name || ''} onChange={(e) => update('name', e.target.value)} /></label><label>EMAIL<input value={active.email || ''} onChange={(e) => update('email', e.target.value)} /></label><label>PHONE<input value={active.phone || ''} onChange={(e) => update('phone', e.target.value)} /></label><label>DOB<input value={active.dob || ''} onChange={(e) => update('dob', e.target.value)} /></label><label>PHOTO<input type="file" accept="image/*" onChange={onUpload('photo')} /></label>{active.photo ? <img src={active.photo} alt="Client" /> : null}</> }, { id: 'i2', token: 'medium', content: <><h3>LIVIN.THICC</h3><label>LIVING THICC PHOTO<input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => update('livingThiccPhoto', String(fr.result || '')); fr.readAsDataURL(f); }} /></label>{highlightPhoto ? <img src={highlightPhoto} alt="Living THICC progress" /> : <p>No photo uploaded yet.</p>}</> }] },
    { id: 'infoB', columns: 1, panels: [{ id: 'i3', token: 'wide', content: <><Food /><Movement /><Medical /></> }] }
  ];
  const peopleShelves = [{ id: 'people', columns: 1, panels: [{ id: 'p1', token: 'medium', content: <><h3>THICC.PEOPLE</h3><div className="people-list">{clients.map((c) => { const cc = resolveClientColor(c.clientColorOptionKey); return <button key={c.id} className="people-item" style={{ borderLeftColor: cc.value }} onClick={() => { setActiveId(c.id); setActiveTab('THICC.INFO'); }}><div><strong>{c.name}</strong><span>{c.id}</span></div><div><em style={{ color: cc.value }}>{cc.label}</em><span>{c.active === false ? 'INACTIVE' : 'ACTIVE'}</span></div></button>; })}</div></> }] }];
  const isSupabase = isSupabaseEnabled();
  const canAssignInSupabase = !isSupabase || !!activeClientDbId;
  const formsShelves = [{ id: 'forms', columns: 1, panels: [{ id: 'f1', token: 'medium', content: <><h3>THICC.FORMS</h3>{forms.map((f) => <div key={f.id} className="form-row"><strong>{f.formName}</strong><span>{f.formCategory}</span><button disabled={!canAssignInSupabase} title={!canAssignInSupabase ? 'ASSIGN disabled: active client is missing a database UUID.' : ''} onClick={async () => { try { setFormsError(''); const created = await upsertFormAssignment({ client: active, client_id: active.id, formDbId: f.dbId || f.id, form_id: f.id, status: 'assigned', response_json: {}, notes: '', assigned_at: new Date().toISOString() }); setAssignments((prev) => [...prev, created]); } catch (error) { setFormsError(error?.message || 'Unable to assign form.'); } }}>ASSIGN</button></div>)}{formsError ? <p>{formsError}</p> : null}<p>ASSIGNMENTS {assignments.filter((a) => (isSupabase ? a.client_id === activeClientDbId : (a.client_id || a.clientId) === active.id)).length}</p></> }] }];
  const timeShelves = [{ id: 'time', columns: 1, panels: [{ id: 't1', token: 'ultra', content: <><h3>THICC.TIME</h3><label>SCHEDULE TYPE<select value={scheduleType} onChange={(e) => setScheduleType(e.target.value)}><option value="personal">MISTA.THICC</option><option value="client">CLIENT</option></select></label><div className="month">{Array.from({ length: 35 }).map((_, i) => <div key={i} className="day"><b>{i + 1 <= 31 ? i + 1 : ''}</b>{calendar.filter((r) => Number(r.entry_date?.slice(-2)) === i + 1).map((r) => { const isPersonal = r.entry_type === 'personal'; const bookingLabel = isPersonal ? (r.client_name || 'Mista.THICC') : (r.client_name || r.workout_label || 'BOOKING'); return <button type="button" key={r.id} className="booking" onClick={() => openEditor(r)} style={{ background: isPersonal ? '#ff4db8' : (colorMap.find((c) => c.key === r.color_option_key)?.value || resolveClientColor(r.color_option_key).value) }}>{bookingLabel}</button>; })}</div>)}</div><div className="form-grid"><label>ENTRY TYPE<select value={entryForm.entry_type} onChange={(e) => setEntryForm((prev) => ({ ...prev, entry_type: e.target.value }))}><option value="personal">MISTA.THICC</option><option value="client">CLIENT</option></select></label><label>DATE<input type="date" value={entryForm.entry_date} onChange={(e) => setEntryForm((prev) => ({ ...prev, entry_date: e.target.value }))} /></label><label>START<input type="time" value={entryForm.start_time} onChange={(e) => setEntryForm((prev) => ({ ...prev, start_time: e.target.value }))} /></label><label>END<input type="time" value={entryForm.end_time} onChange={(e) => setEntryForm((prev) => ({ ...prev, end_time: e.target.value }))} /></label><label>WORKOUT LABEL<input value={entryForm.workout_label} onChange={(e) => setEntryForm((prev) => ({ ...prev, workout_label: e.target.value }))} /></label><label>LOCATION<input value={entryForm.location} onChange={(e) => setEntryForm((prev) => ({ ...prev, location: e.target.value }))} /></label><label>NOTES<textarea value={entryForm.notes} onChange={(e) => setEntryForm((prev) => ({ ...prev, notes: e.target.value }))} /></label></div><div className="form-row"><button onClick={async () => { try { setTimeError(''); const now = new Date(); const isEditing = editorMode === 'edit' && editingEntryId; let payload = { ...entryForm, source_split_day: days[new Date(entryForm.entry_date || now.toISOString().slice(0, 10)).getDay()], updated_at: now.toISOString() }; if (payload.entry_type === 'personal') { payload = { ...payload, client_id: null, client_name: 'Mista.THICC', color_option_key: 'mista-thicc-pink' }; } else if (isEditing && editingEntryOwner) { payload = { ...payload, client_id: editingEntryOwner.client_id, client_name: editingEntryOwner.client_name || 'THICC CLIENT', color_option_key: (editingEntryOwner.color_option_key && editingEntryOwner.color_option_key !== 'mista-thicc-pink') ? editingEntryOwner.color_option_key : 'cobalt' }; } else { const ensuredClient = isSupabase ? await ensureClientDbId(active) : active; if (isSupabase && ensuredClient.dbId && ensuredClient.dbId !== active.dbId) { const nextClients = clients.map((c) => (c.id === active.id ? ensuredClient : c)); setClients(nextClients); saveClients(nextClients); } const scheduleClientId = isSupabase ? getClientDbId(ensuredClient) : ensuredClient.id; if (isSupabase && !scheduleClientId) throw new Error('Cannot save THICC.TIME entry: active client is missing a database UUID.'); const activeColor = ensuredClient.clientColorOptionKey || 'cobalt'; payload = { ...payload, client_id: scheduleClientId || null, client_name: ensuredClient.name || ensuredClient.display_name || 'THICC CLIENT', color_option_key: activeColor === 'mista-thicc-pink' ? 'cobalt' : activeColor }; } if (isEditing) payload.id = editingEntryId; else payload.created_at = now.toISOString(); const saved = await upsertScheduleEntry(payload); if (isEditing) setCalendar((prev) => prev.map((x) => (x.id === editingEntryId ? saved : x))); else setCalendar((prev) => [...prev, saved]); if (isSupabase) setCalendar(await fetchScheduleEntries()); resetEntryForm(); } catch (error) { setTimeError(error?.message || 'Unable to save entry.'); } }}>SAVE</button><button onClick={async () => { try { if (!editingEntryId) return; setTimeError(''); await deleteScheduleEntry(editingEntryId); setCalendar((prev) => prev.filter((x) => x.id !== editingEntryId)); if (isSupabase) setCalendar(await fetchScheduleEntries()); resetEntryForm(); } catch (error) { setTimeError(error?.message || 'Unable to delete entry.'); } }}>DELETE</button><button onClick={() => resetEntryForm()}>CANCEL</button></div>{timeError ? <p>{timeError}</p> : null}</> }] }];
  const nomoShelves = [{ id: 'nomo', columns: 1, panels: [{ id: 'n1', token: 'medium', content: <><h3>THICC.NOMO</h3><p>Deactivate/archive current client from active roster.</p><button onClick={() => { if (!window.confirm('THICC.NOMO this client?')) return; const nextClients = clients.map((c) => (c.id === active.id ? { ...c, active: false } : c)); persist(nextClients, 'client:nomo'); const nextActive = nextClients.find((c) => c.active !== false); setActiveId(nextActive?.id || ''); setActiveTab('THICC.INFO'); }}>THICC.NOMO</button></> }] }];

  const shelves = activeTab === 'THICC.INFO' ? infoShelves : activeTab === 'THICC.PEOPLE' ? peopleShelves : activeTab === 'THICC.FORMS' ? formsShelves : activeTab === 'THICC.TIME' ? timeShelves : nomoShelves;
  return <SectionShell className="igtv2-page"><ScenePlate className="igtv2-scene-plate"><div className="igtv2-bg" /></ScenePlate><SectionOverlay><ArtLane className="igtv2-left"><div className="igtv2-cabinet">{tabs.map((tab) => <button key={tab} className={`igtv2-cabinet-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div></ArtLane><ContentScroller><BlueprintStack shelves={shelves.map((s) => s.id === 'time' ? ({ ...s, panels: s.panels.map((p) => ({ ...p, className: 'igtv2-time-panel' })) }) : s)} /></ContentScroller></SectionOverlay></SectionShell>;
}
