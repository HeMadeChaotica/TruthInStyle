'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/its-getting-thicc.css';
import '../../styles/sections/universal-frame.css';
import { optionRegistry } from '../../lib/dropdowns/optionRegistry';
import {
  appendLog, deleteScheduleEntry, fetchClientColors, fetchFormAssignments, fetchForms, fetchScheduleEntries, groupScheduleEntriesByDate, loadClients, readMedia, resolveClientColor,
  saveClients, upsertFormAssignment, upsertMedia, saveScheduleEntry, getClientDbId, getScheduleClientId, isSupabaseEnabled, ensureClientDbId, normalizeScheduleEntry, buildThiccTimeAssurerPayload, toLocalIsoDate, isLocalIsoDateKey, validateScheduleEntry,
  createClientTemplate, createLocalClientId, generatePublicThiccenId, getPublicThiccenId,
} from '../../src/services/itsGettingThiccService';
import { uploadPrivateImage } from '../../src/services/mediaUploadService';
import { ArtLane, BlueprintStack, ContentScroller, ScenePlate, SectionOverlay, SectionShell } from '../shared/UniversalSectionFrame';
import ChaoticaMonthCalendar from '../shared/ChaoticaMonthCalendar';
import { normalizeObjectStrings, normalizeUserText } from '../../lib/utils/textCasing';
import { flushAllPendingSaves } from '../../lib/state/autosaveRegistry';
import { CLOCK_IT_KEYS, useClockItNumericOptions, useClockItOptions } from '../../lib/dropdowns/clockItRegistry';

const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const tabs = ['THICC.INFO', 'THICC.PEOPLE', 'THICC.FORMS', 'THICC.TIME', 'THICC.NOMO'];
const foodPrompts = ['WHAT DO YOU STRUGGLE THE HARDEST TO STAY AWAY FROM', 'WHEN DO YOU USUALLY REACH FOR IT (TIME, MOOD, SITUATION)', 'GROWING UP, WERE YOU FORCED TO FINISH YOUR PLATE, AND HOW HAS THAT AFFECTED YOUR EATING HABITS IN ADULTHOOD?', 'WERE THERE FOOD RULES, PUNISHMENTS, PRESSURE, OR EMOTIONALLY CHARGED EXPERIENCES AROUND EATING GROWING UP THAT STILL AFFECT HOW YOU EAT NOW?', 'HOW DO YOUR EMOTIONS AND FOOD INTERACT TODAY'];
const movementPrompts = ['WALK ME THROUGH A TYPICAL DAY OF EATING', 'WALK ME THROUGH A NORMAL DAY IN YOUR BODY', 'HOW MUCH OF YOUR DAY IS SITTING VS ACTUALLY MOVING', 'WHEN DO YOU FEEL MOST PHYSICALLY ALIVE'];
const medicalPrompts = ['EMERGENCY CONTACT NAME / NUMBER', 'PAST / CURRENT INJURIES', 'PAST / UPCOMING SURGERIES', 'RECURRING SEASONAL ISSUES / ALLERGIES', 'MEDICATIONS THAT COULD CAUSE COMPLICATIONS, LIKE BLOOD PRESSURE MEDS', 'PHYSICAL LIMITATIONS', 'MOVEMENTS THAT CAUSE PAIN', 'LEVEL OF FLEXIBILITY, RANGE FROM RIGAMORTUS TO SIMONE BILES WISHES', 'HARD NO’S', 'TRAINING FEARS'];

const createFallbackCelebration = () => Array.from({ length: 10 }, (_, i) => ({ id: `tile-${i + 1}`, text: '', media: '' }));

const safeFallbackClient = {
  id: 'local_safe_its',
  name: 'THICC CLIENT',
  clientColorOptionKey: 'cobalt',
  referrals: [{ name: '', date: '', status: '', notes: '' }],
  trainingRest: Array.from({ length: 7 }, () => 'TRAINING'),
  programSplit: Array.from({ length: 7 }, () => 'FULLBODY'),
  celebration: createFallbackCelebration(),
  active: true,
};

const normalizeClientForView = (client) => {
  if (!client || typeof client !== 'object') return null;
  return {
    ...client,
    id: typeof client.id === 'string' ? client.id : '',
    thiccen_id: getPublicThiccenId(client) || client.thiccen_id || 'Thiccen # pending',
    name: typeof client.name === 'string' ? client.name : 'THICC CLIENT',
    clientColorOptionKey: resolveClientColor(client.clientColorOptionKey).key,
    referrals: Array.isArray(client.referrals) && client.referrals.length ? client.referrals : [{ name: '', date: '', status: '', notes: '' }],
    trainingRest: Array.from({ length: 7 }, (_, i) => client.trainingRest?.[i] || 'TRAINING'),
    programSplit: Array.from({ length: 7 }, (_, i) => client.programSplit?.[i] || 'FULLBODY'),
    celebration: Array.isArray(client.celebration) ? client.celebration.slice(0, 10) : createFallbackCelebration(),
  };
};

const getTodayDateKey = () => toLocalIsoDate(new Date()) || '1970-01-01';

const logThiccTimeDiagnostic = (loader, failureType, error, extra = {}) => {
  console.error('THICC.TIME diagnostic', { loader, failureType, message: error?.message || '', stack: error?.stack || '', error, ...extra });
};

const formatDisplayDate = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.includes('-')) {
    const [year, month, day] = value.split('-');
    return `${month}/${day}/${year}`;
  }
  const next = new Date(value);
  if (Number.isNaN(next.getTime())) return '';
  const month = String(next.getMonth() + 1).padStart(2, '0');
  const day = String(next.getDate()).padStart(2, '0');
  const year = next.getFullYear();
  return `${month}/${day}/${year}`;
};

export default function ItsGettingThiccSection() {
  const sexOptions = useClockItOptions(CLOCK_IT_KEYS.itsSex);
  const orientationOptions = useClockItOptions(CLOCK_IT_KEYS.itsSexualOrientation);
  const activityOptions = useClockItOptions(CLOCK_IT_KEYS.itsActivityLevel);
  const relationshipOptions = useClockItOptions(CLOCK_IT_KEYS.itsRelationshipStatus);
  const clockItColors = useClockItOptions(CLOCK_IT_KEYS.itsClientColors);
  const trainingRestOptions = useClockItOptions(CLOCK_IT_KEYS.itsTrainingRest);
  const programSplitOptions = useClockItOptions(CLOCK_IT_KEYS.itsProgramSplit);
  const weightOptions = useClockItNumericOptions(CLOCK_IT_KEYS.currentGoalWeight);
  const heightOptions = useClockItNumericOptions(CLOCK_IT_KEYS.height);
  const ageOptions = useClockItNumericOptions(CLOCK_IT_KEYS.age);
  const [clients, setClients] = useState([]); const [activeId, setActiveId] = useState(''); const [activeTab, setActiveTab] = useState('THICC.INFO');
  const [forms, setForms] = useState([]); const [assignments, setAssignments] = useState([]); const [colorMap, setColorMap] = useState([]);
  const [formsError, setFormsError] = useState('');
  const [selectedTimeDate, setSelectedTimeDate] = useState(() => getTodayDateKey());
  const [entriesByDate, setEntriesByDate] = useState({});
  const [timeLoadStatus, setTimeLoadStatus] = useState('idle');
  const [timeError, setTimeError] = useState('');
  const [timeActionStatus, setTimeActionStatus] = useState('idle');
  const [editingEntryId, setEditingEntryId] = useState('');
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [infoDraft, setInfoDraft] = useState(null);
  const [isNewInfoDraft, setIsNewInfoDraft] = useState(false);
  const [infoStatus, setInfoStatus] = useState('');
  const [timeDraft, setTimeDraft] = useState({ entry_type: 'client', client_id: '', client_name: '', entry_date: '', start_time: '09:00', end_time: '10:00', workout_label: '', source_split_day: '', location: '', notes: '', color_option_key: 'cobalt' });
  const safeClients = useMemo(() => { try { return (Array.isArray(clients) ? clients : []).filter(Boolean).map((c) => normalizeClientForView(c)).filter(Boolean); } catch (error) { logThiccTimeDiagnostic('safeClients', 'undefined data shape', error); return []; } }, [clients]);
  const active = useMemo(() => safeClients.find((c) => c.id === activeId) || safeClients[0] || safeFallbackClient, [safeClients, activeId]);
  const activeClientDbId = useMemo(() => getClientDbId(active), [active]);
  const isSupabase = isSupabaseEnabled();
  const getClientScheduleId = (client) => getScheduleClientId(client, isSupabase);
  const infoClient = infoDraft || active;
  const publicThiccenId = getPublicThiccenId(infoClient) || infoClient?.thiccen_id || 'Thiccen # pending';
  const displayClientName = (client = {}) => {
    const name = String(client.name || '').trim();
    const publicId = getPublicThiccenId(client) || client.thiccen_id || 'Thiccen # pending';
    return [name || 'THICC CLIENT', publicId].filter(Boolean).join(' • ');
  };


  const loadTimeEntries = async () => {
    try {
      setTimeError('');
      setTimeLoadStatus('loading');
      const rows = await fetchScheduleEntries();
      const safeRows = Array.isArray(rows) ? rows : [];
      setEntriesByDate(groupScheduleEntriesByDate(safeRows));
      setTimeLoadStatus('loaded');
    } catch (error) {
      logThiccTimeDiagnostic('loadTimeEntries', 'schedule load', error);
      setEntriesByDate({});
      setTimeLoadStatus('loaded');
      setTimeError('');
    }
  };

  useEffect(() => {
    try {
      const seeded = loadClients();
      const safeSeeded = Array.isArray(seeded) ? seeded : [];
      setClients(safeSeeded);
      setActiveId(safeSeeded[0]?.id || '');
      if (!safeSeeded.length) {
        setInfoDraft(createClientTemplate([]));
        setIsNewInfoDraft(true);
      }
    } catch (error) {
      logThiccTimeDiagnostic('loadClients', 'client load', error);
      setClients([]);
      setActiveId('');
    }
    loadTimeEntries();
    fetchClientColors().then((rows) => setColorMap(Array.isArray(rows) ? rows : [])).catch((error) => {
      logThiccTimeDiagnostic('fetchClientColors', 'color load', error);
      setColorMap([]);
    });
    fetchForms().then((rows) => setForms(Array.isArray(rows) ? rows : [])).catch((error) => {
      console.error('ITS.GETTING.THICC forms load failed', { message: error?.message || '', stack: error?.stack || '', error });
      setForms([]);
    });
    fetchFormAssignments().then((rows) => setAssignments(Array.isArray(rows) ? rows : [])).catch((error) => {
      console.error('ITS.GETTING.THICC assignments load failed', { message: error?.message || '', stack: error?.stack || '', error });
      setAssignments([]);
    });
  }, []);
  useEffect(() => {
    const selected = safeClients.find((c) => c.id === activeId);
    if (selected) {
      setInfoDraft({ ...selected, thiccen_id: getPublicThiccenId(selected) || selected.thiccen_id || generatePublicThiccenId(safeClients) });
      setIsNewInfoDraft(false);
      setInfoStatus('');
    }
  }, [activeId, safeClients]);

  const persist = async (next, event = 'save') => {
    setClients(next);
    saveClients(next);
    appendLog(event, { activeId });
    return flushAllPendingSaves();
  };
  const update = (key, value) => {
    const nextValue = key === 'clientColorOptionKey' ? value : normalizeObjectStrings(value);
    setInfoDraft((prev) => ({ ...(prev || infoClient || createClientTemplate(clients)), [key]: nextValue }));
    setInfoStatus('UNSAVED CHANGES');
  };
  const updateArray = (key, i, value) => update(key, (infoClient[key] || []).map((v, idx) => (idx === i ? value : v)));
  const startNewClient = () => {
    const fresh = createClientTemplate(clients);
    fresh.id = createLocalClientId();
    fresh.thiccen_id = generatePublicThiccenId(clients);
    setInfoDraft(fresh);
    setIsNewInfoDraft(true);
    setInfoStatus('NEW CLIENT DRAFT READY');
    setActiveTab('THICC.INFO');
  };
  const saveInfoDraft = async () => {
    const draft = { ...(infoDraft || infoClient || createClientTemplate(clients)) };
    draft.id = draft.id || createLocalClientId();
    draft.thiccen_id = getPublicThiccenId(draft) || draft.thiccen_id || generatePublicThiccenId(clients);
    const next = (Array.isArray(clients) ? clients : []).some((c) => c.id === draft.id)
      ? clients.map((c) => (c.id === draft.id ? draft : c))
      : [...(Array.isArray(clients) ? clients : []), draft];
    setInfoStatus('SAVING THICC.INFO');
    const saveResult = await persist(next, isNewInfoDraft ? 'client:new' : 'client:update');
    setActiveId(draft.id);
    setInfoDraft(draft);
    setIsNewInfoDraft(false);
    setInfoStatus(saveResult?.ok ? 'THICC.INFO SAVED TO CLOUD' : 'THICC.INFO SAVED ON THIS DEVICE');
  };
  const onUpload = (slot) => async (event) => {
    const file = event.target.files?.[0];
    if (!file || !infoClient) return;
    try {
      const uploaded = await uploadPrivateImage(file, { context: 'its-getting-thicc', sourceDate: new Date().toISOString().slice(0, 10) });
      const durableUrl = upsertMedia(infoClient.id, slot, uploaded.url);
      if (slot === 'livingThiccPhoto') update('livingThiccPhoto', durableUrl);
      else update('celebration', (infoClient.celebration || []).map((tile, index) => (index === Number(slot) ? { ...tile, media: durableUrl } : tile)));
    } catch (error) {
      setInfoStatus(`IMAGE UPLOAD FAILED: ${error?.message || 'UNKNOWN ERROR'}`);
    }
  };
  function Food() { return <><h3>FOOD: THE GOOD, THE BAD & THE “I DESERVE THIS”</h3>{foodPrompts.map((p, i) => <label key={p}>{`${i + 1}. ${p}`}<textarea value={infoClient[`food${i + 1}`] || ''} onChange={(e) => update(`food${i + 1}`, e.target.value)} /></label>)}</>; }
  function Movement() { return <><h3>MOVEMENT: THE MEASURE AND THE PRESSURES</h3>{movementPrompts.map((p, i) => <label key={p}>{`${i + 1}. ${p}`}{i === 1 && <small>THINK WORK, ERRANDS, SITTING, STANDING, STEPS, STRESS, AND HOW OFTEN YOUR BODY IS ACTUALLY IN MOTION, NOT JUST HOW OFTEN YOU MEANT TO WORK OUT.</small>}<textarea value={infoClient[`move${i + 1}`] || ''} onChange={(e) => update(`move${i + 1}`, e.target.value)} /></label>)}<label>5. SELECT CURRENT OVERALL LEVEL OF ACTIVITY<select value={infoClient.activity || 'SEDENTARY'} onChange={(e) => update('activity', e.target.value)}>{activityOptions.map((o) => <option key={o}>{o}</option>)}</select></label></>; }
  function Medical() { const keys=['emergencyContact','injuries','surgeries','allergies','medications','limits','painfulMovements','flexibility','hardNos','trainingFears']; return <><h3>MEDICAL ADVISORY</h3>{medicalPrompts.map((p, i) => <label key={p}>{`${i + 1}. ${p}`}<textarea value={infoClient[keys[i]] || ''} onChange={(e) => update(keys[i], e.target.value)} /></label>)}</>; }

  const hasRealClients = safeClients.length > 0;
  const peopleShelves = [{ id: 'people', columns: 1, panels: [{ id: 'p1', token: 'medium', content: <><h3>THICC.PEOPLE</h3>{!hasRealClients ? <p>NO CLIENTS YET. ADD A CLIENT IN THICC.PEOPLE TO ENABLE CLIENT SCHEDULING.</p> : null}<div className="people-list">{safeClients.map((c) => { const cc = resolveClientColor(c.clientColorOptionKey); return <button key={c.id} className="people-item" style={{ borderLeftColor: cc.value }} onClick={() => { setActiveId(c.id); setActiveTab('THICC.INFO'); }}><div><strong>{c.name || 'THICC CLIENT'}</strong><span>{getPublicThiccenId(c) || c.thiccen_id || 'Thiccen # pending'}</span></div><div><em style={{ color: cc.value }}>{cc.label}</em><span>{c.active === false ? 'INACTIVE' : 'ACTIVE'}</span></div></button>; })}</div></> }] }];
  const activeClientId = active?.id || '';
  const canAssignInSupabase = Boolean(active) && (!isSupabase || Boolean(activeClientDbId));
  const formsShelves = [{ id: 'forms', columns: 1, panels: [{ id: 'f1', token: 'medium', content: <><h3>THICC.FORMS</h3>{forms.map((f) => <div key={f.id} className="form-row"><strong>{f.formName}</strong><span>{f.formCategory}</span><button disabled={!canAssignInSupabase} title={!canAssignInSupabase ? 'ASSIGN disabled: active client is missing a database UUID.' : ''} onClick={async () => { try { setFormsError(''); const ensuredClient = isSupabase ? await ensureClientDbId(active) : active; if (isSupabase && ensuredClient.dbId && ensuredClient.dbId !== active.dbId) { const nextClients = clients.map((c) => (c.id === active.id ? ensuredClient : c)); setClients(nextClients); saveClients(nextClients); } const created = await upsertFormAssignment({ client: ensuredClient, client_id: ensuredClient.dbId || ensuredClient.id, formDbId: f.dbId || f.id, form_id: f.id, status: 'assigned', response_json: {}, notes: '', assigned_at: new Date().toISOString() }); setAssignments((prev) => [...prev, created]); } catch (error) { setFormsError(error?.message || 'Unable to assign form.'); } }}>ASSIGN</button></div>)}{formsError ? <p>{formsError}</p> : null}<p>ASSIGNMENTS {assignments.filter((a) => (isSupabase ? a.client_id === activeClientDbId : (a.client_id || a.clientId) === activeClientId)).length}</p></> }] }];
  const resetTimeDraft = () => {
    const now = new Date();
    setEditingEntryId('');
    setTimeDraft({
      entry_type: 'personal',
      schedule_layer: 'mista_thicc',
      client_id: null,
      client_name: '',
      prospect_name: '',
      prospect_contact: '',
      entry_date: toLocalIsoDate(now),
      start_time: '09:00',
      end_time: '10:00',
      workout_label: active?.programSplit?.[now.getDay()] || 'SESSION',
      source_split_day: days[now.getDay()],
      color_option_key: 'mista-thicc-pink',
      recurrence_type: 'none',
      recurrence_days: [],
      recurrence_active: false,
      location: '',
      notes: '',
    });
  };


  const normalizeSchedulePayload = ({ currentEntryForm, currentActive }) => {
    const now = new Date();
    const today = toLocalIsoDate(now);
    const entryType = currentEntryForm.entry_type || 'client';
    const safeDate = isLocalIsoDateKey(currentEntryForm.entry_date) ? currentEntryForm.entry_date : today;
    const parsedDayIndex = new Date(`${safeDate}T12:00:00`).getDay();
    const fallbackDayIndex = now.getDay();
    const safeDayIndex = Number.isInteger(parsedDayIndex) && parsedDayIndex >= 0 && parsedDayIndex < days.length ? parsedDayIndex : fallbackDayIndex;
    const safeDay = days[safeDayIndex];
    return {
      entry_type: entryType,
      entry_date: safeDate,
      start_time: currentEntryForm.start_time || '09:00',
      end_time: currentEntryForm.end_time || '10:00',
      workout_label: normalizeUserText(currentEntryForm.workout_label || ''),
      source_split_day: safeDay,
      location: normalizeUserText(currentEntryForm.location || ''),
      notes: normalizeUserText(currentEntryForm.notes || ''),
    };
  };

  useEffect(() => { resetTimeDraft(); }, [activeId]);


  const highlightPhoto = infoClient?.livingThiccPhoto || (infoClient ? readMedia(infoClient.id, 'livingThiccPhoto') : '');

  const infoShelves = [
    { id: 'A', columns: 3, panels: [
      { id: 'info-actions', token: 'strip', className: 'igtv2-info-actions', content: <><div><h3>THICC.INFO</h3><strong>{publicThiccenId}</strong><small>{isNewInfoDraft ? 'NEW UNSAVED CLIENT' : 'EDITING SAVED CLIENT'}</small></div><div className="info-action-buttons"><button type="button" onClick={startNewClient}>NEW CLIENT</button><button type="button" onClick={saveInfoDraft}>SAVE THICC.INFO</button></div>{infoStatus ? <p>{infoStatus}</p> : null}</> },
      { id: 'stats', token: 'tall', className:'igtv2-client-core', content: <><h3>THICC.STATS</h3><div className="client-core-grid">{['name','thiccen_id','phone','sex','sexualOrientation','height','age','email','relationshipStatus','clientColorOptionKey','currentWeight','goalWeight','currentBmi','goalBmi'].map((k) => <label key={k}>{k==='thiccen_id'?'THICC ID':k==='relationshipStatus'?'MARRIED / SINGLE':k==='phone'?'PHONE NUMBER':k==='sexualOrientation'?'SEXUAL ORIENTATION':k==='clientColorOptionKey'?'CLIENT COLOR':k.replace(/([A-Z])/g,' $1').toUpperCase()}{k==='thiccen_id'?<input value={publicThiccenId} readOnly aria-readonly="true" />:k==='clientColorOptionKey'?<select value={infoClient.clientColorOptionKey||'cobalt'} style={{ borderColor: resolveClientColor(infoClient.clientColorOptionKey).value }} onChange={(e)=>update('clientColorOptionKey',e.target.value)}>{(colorMap.length ? colorMap : clockItColors).map((o)=><option key={o.key} value={o.key}>{o.label}</option>)}</select>:k==='relationshipStatus'?<select value={infoClient.relationshipStatus||'SINGLE'} onChange={(e)=>update('relationshipStatus',e.target.value)}>{relationshipOptions.map((o)=><option key={o}>{o}</option>)}</select>:(['sex','sexualOrientation'].includes(k)?<select value={infoClient[k]||''} onChange={(e)=>update(k,e.target.value)}><option value="">SELECT</option>{(k==='sex'?sexOptions:orientationOptions).map((o)=><option key={o}>{o}</option>)}</select>:['currentWeight','goalWeight','height','age'].includes(k)?<select value={infoClient[k]||''} onChange={(e)=>update(k,e.target.value)}><option value="">SELECT</option>{(k==='height'?heightOptions:k==='age'?ageOptions:weightOptions).map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:<input value={infoClient[k]||''} onChange={(e)=>update(k,e.target.value)} />)}</label>)}</div></> },
      { id: 'living-thicc', token: 'tall', className:'igtv2-living-thicc', content: <><h3>LIVIN THICC SINCE</h3><label><input type="date" value={infoClient.livingThiccSinceDate||''} onChange={(e)=>update('livingThiccSinceDate',e.target.value)} /></label><label className="upload">{highlightPhoto ? <img src={highlightPhoto} alt="living thicc" /> : 'PHOTO UPLOAD FROM LIBRARY'}<input type="file" accept="image/*" onChange={onUpload('livingThiccPhoto')} /></label></> },
    ] },
    { id: 'B', columns: 1, panels: [{ id: 'food', token: 'tall', content: <Food /> }] },
    { id: 'C', columns: 2, panels: [{ id: 'move', token: 'tall', content: <Movement /> }, { id: 'med', token: 'tall', content: <Medical /> }] },
    { id: 'D', columns: 4, panels: [
      { id: 'macro', token: 'standard', content: <><h3>MACRO TARGETS</h3><div className="macro-inline-wrap">{[['macro_protein','PROTEIN'],['macro_carbs','CARBS'],['macro_fats','FATS'],['macro_water','WATER'],['macro_calories','CALORIES']].map(([k,l])=><label key={k}>{l}<input value={infoClient[k]||''} onChange={(e)=>update(k,e.target.value)} /></label>)}</div></> },
      { id: 'vault', token: 'standard', content: <><h3>VAULT</h3>{[['juice_substance','COMPOUND'],['juice_ester','ESTER / FORM'],['juice_amount','AMOUNT'],['juice_shot','SHOT __ OF __'],['juice_sensitivity','SENSITIVITY / SIDE EFFECTS'],['juice_cycle','CYCLE WEEK __ OF __'],['juice_location','LOCATION'],['juice_notes','NOTES']].map(([k,l])=><label key={k}>{l}{k.includes('notes')||k.includes('sensitivity')?<textarea value={infoClient[k]||''} onChange={(e)=>update(k,e.target.value)} />:(['sex','sexualOrientation'].includes(k)?<select value={infoClient[k]||''} onChange={(e)=>update(k,e.target.value)}><option value="">SELECT</option>{(k==='sex'?sexOptions:orientationOptions).map((o)=><option key={o}>{o}</option>)}</select>:['currentWeight','goalWeight','height','age'].includes(k)?<select value={infoClient[k]||''} onChange={(e)=>update(k,e.target.value)}><option value="">SELECT</option>{(k==='height'?heightOptions:k==='age'?ageOptions:weightOptions).map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:<input value={infoClient[k]||''} onChange={(e)=>update(k,e.target.value)} />)}</label>)}</> },
      { id: 'spw', token: 'standard', content: <><h3>SEASONS PER WEEK</h3><input value={infoClient.seasonsPerWeek||''} onChange={(e)=>update('seasonsPerWeek',e.target.value)} /></> },
      { id: 'ref', token: 'standard', content: <><h3>REFERRAL TRACKER</h3>{(infoClient.referrals||[]).slice(0,1).map((r,i)=><div key={i} className="form-row"><input placeholder="NAME" value={r.name||''} onChange={(e)=>update('referrals',[{...r,name:e.target.value}])}/><input placeholder="DATE" value={r.date||''} onChange={(e)=>update('referrals',[{...r,date:e.target.value}])}/><input placeholder="STATUS" value={r.status||''} onChange={(e)=>update('referrals',[{...r,status:e.target.value}])}/></div>)}<textarea placeholder="NOTES" value={infoClient.referrals?.[0]?.notes||''} onChange={(e)=>update('referrals',[{...(infoClient.referrals?.[0]||{}),notes:e.target.value}])} /></> },
    ]},
    { id: 'E', columns: 1, panels: [{ id: 'train', token: 'tall', className:'igtv2-training-system', content: <><h3>TRAINING SYSTEM</h3><div className="training-system-band"><h4>TRAINING / REST</h4><div className="hz">{days.map((d,i)=><label key={d}>{d}<select value={infoClient.trainingRest?.[i]||'TRAINING'} onChange={(e)=>updateArray('trainingRest',i,e.target.value)}>{trainingRestOptions.map((o)=><option key={o}>{o}</option>)}</select></label>)}</div></div><div className="training-system-band"><h4>CURRENT EXERCISE PROGRAM SPLIT / WORKOUT DAY</h4><div className="hz">{days.map((d,i)=><label key={d}>{d}<select value={infoClient.programSplit?.[i]||'FULLBODY'} onChange={(e)=>updateArray('programSplit',i,e.target.value)}>{programSplitOptions.map((o)=><option key={o}>{o}</option>)}</select></label>)}</div></div></> }] },
    { id: 'F', columns: 2, panels: [{ id: 'event', token: 'standard', content: <><h3>UPCOMING TRAINING FOCUS EVENTS</h3><textarea value={infoClient.eventNotes||''} onChange={(e)=>update('eventNotes',e.target.value)} /></> }, { id: 'pay', token: 'standard', content: <><h3>PAYMENT</h3><input value={infoClient.paymentDate||''} onChange={(e)=>update('paymentDate',e.target.value)} /></> }] },
    { id: 'G', columns: 2, panels: [{ id: 'thoughts', token: 'tall', content: <><h3>THICC THOUGHTS</h3><textarea className="notes" value={infoClient.thoughts||''} onChange={(e)=>update('thoughts',e.target.value)} /></> }, { id: 'myfit', token: 'standard', content: <><h3>MYFITFOODS CHECK-IN</h3><label>WEEKLY # OF MEALS ______<input value={infoClient.myfitMeals||''} onChange={(e)=>update('myfitMeals',e.target.value)} /></label><label>HAS BEEN VERIFIED BY ANTHONY  Y / N<select value={infoClient.myfitVerified ? 'Y' : 'N'} onChange={(e)=>update('myfitVerified', e.target.value === 'Y')}><option>Y</option><option>N</option></select></label></> }] },
      { id: 'H', columns: 1, panels: [{ id: 'cele', token: 'tall', content: <><h3>CELEBRATION MOMENTS</h3><div className="cele">{(infoClient.celebration || []).slice(0, 10).map((tile, i) => <div key={tile.id || i} className="slot"><textarea placeholder="CELEBRATION MOMENT" value={tile.text || ''} onChange={(e) => update('celebration', (infoClient.celebration || []).map((t, idx) => (idx === i ? { ...t, text: e.target.value } : t)))} />{tile.media ? <img src={tile.media} alt="" /> : null}<input type="file" accept="image/*" onChange={onUpload(String(i))} /></div>)}</div></> }] },
  ];

  const getLayerFromEntry = (entry = {}) => entry.schedule_layer || (entry.entry_type === 'personal' ? 'mista_thicc' : 'the_thiccens');
  const getClientScheduleColorKey = (key) => (key === 'mista-thicc-pink' ? 'cobalt' : resolveClientColor(key).key === 'mista-thicc-pink' ? 'cobalt' : (key || 'cobalt'));
  const entryColor = (entry = {}) => {
    try {
      if (entry.schedule_layer === 'mista_thicc') return '#ff4db8';
      if (entry.schedule_layer === 'new_client') return '#f8f8f8';
      const safeKey = getClientScheduleColorKey(entry.color_option_key);
      const safeColorMap = Array.isArray(colorMap) ? colorMap : [];
      return safeColorMap.find((c) => c.key === safeKey)?.value || resolveClientColor(safeKey).value;
    } catch (error) {
      logThiccTimeDiagnostic('entryColor', 'calendar component props', error);
      return '#3b82f6';
    }
  };
  const getChipLabel = (entry = {}) => {
    if (entry.schedule_layer === 'mista_thicc') return entry.workout_label || 'MISTA.THICC';
    if (entry.schedule_layer === 'new_client') return entry.prospect_name || 'NEW CLIENT';
    return entry.client_name || entry.workout_label || 'THE.THICCENS';
  };

  const openNewEditor = (dateKey) => {
    if (!isLocalIsoDateKey(dateKey)) return;
    setSelectedTimeDate(dateKey);
    setEditingEntryId('');
    setEditorOpen(true);
    setTimeDraft({ entry_type: 'personal', schedule_layer: 'mista_thicc', client_id: null, client_name: '', prospect_name: '', prospect_contact: '', entry_date: dateKey, start_time: '09:00', end_time: '10:00', workout_label: '', source_split_day: days[new Date(`${dateKey}T12:00:00`).getDay()], location: '', notes: '', color_option_key: 'mista-thicc-pink', recurrence_type: 'none', recurrence_days: [], recurrence_active: false });
  };
  const openEditor = (row) => {
    const safeDateKey = isLocalIsoDateKey(row?.entry_date) ? row.entry_date : getTodayDateKey();
    setSelectedTimeDate(safeDateKey);
    setEditingEntryId(row?.id || '');
    setEditorOpen(true);
    setTimeDraft({ ...row, entry_date: safeDateKey, schedule_layer: getLayerFromEntry(row), recurrence_type: row?.recurrence_type || 'none', recurrence_days: Array.isArray(row?.recurrence_days) ? row.recurrence_days : [], recurrence_active: Boolean(row?.recurrence_active) });
  };

  const visibleEntriesByDate = useMemo(() => entriesByDate && typeof entriesByDate === 'object' ? entriesByDate : {}, [entriesByDate]);
  const safeSelectedTimeDate = isLocalIsoDateKey(selectedTimeDate) ? selectedTimeDate : getTodayDateKey();
  const assurerPayloadPreview = useMemo(() => {
    try {
      return buildThiccTimeAssurerPayload(visibleEntriesByDate);
    } catch (error) {
      logThiccTimeDiagnostic('buildThiccTimeAssurerPayload', 'date helper', error);
      return { source: 'THICC.TIME', range: '7_DAY', entries: [] };
    }
  }, [visibleEntriesByDate]);

  const selectedDayEntries = Array.isArray(visibleEntriesByDate[safeSelectedTimeDate]) ? visibleEntriesByDate[safeSelectedTimeDate] : [];
  const closeTimeEditor = () => {
    setEditorOpen(false);
    setEditingEntryId('');
  };
  const resolveEditableEntry = (row) => (row?.derived_recurrence
    ? entriesByDate[row.original_entry_date]?.find((entry) => entry.id === row.original_entry_id) || row
    : row);
  const saveTimeDraft = async () => {
    const previousEntries = entriesByDate;
    try {
      setTimeError('');
      setTimeActionStatus('saving');
      if (!isLocalIsoDateKey(timeDraft.entry_date)) {
        setTimeError('Select a valid THICC.TIME date first.');
        return;
      }
      if (!timeDraft.start_time) {
        setTimeError('Set START TIME first.');
        return;
      }
      if (!String(timeDraft.workout_label || '').trim() && !String(timeDraft.notes || '').trim()) {
        setTimeError('Add a workout label or notes before saving.');
        return;
      }
      if (timeDraft.schedule_layer === 'the_thiccens' && !hasRealClients) {
        setTimeError('Select a logged client for THE.THICCENS.');
        return;
      }
      const base = normalizeSchedulePayload({ currentEntryForm: timeDraft, currentActive: active });
      let payload = {
        ...base,
        schedule_layer: timeDraft.schedule_layer,
        prospect_name: normalizeUserText(timeDraft.prospect_name || ''),
        prospect_contact: normalizeUserText(timeDraft.prospect_contact || ''),
        recurrence_type: timeDraft.recurrence_type === 'weekly' ? 'weekly' : 'none',
        recurrence_days: timeDraft.recurrence_type === 'weekly' ? [...new Set(timeDraft.recurrence_days || [])] : [],
        recurrence_active: timeDraft.recurrence_type === 'weekly' && Boolean(timeDraft.recurrence_active),
      };
      if (timeDraft.schedule_layer === 'mista_thicc') {
        payload = { ...payload, entry_type: 'personal', client_id: null, client_name: '', color_option_key: 'mista-thicc-pink' };
      } else {
        const selectedClient = safeClients.find((client) => getClientScheduleId(client) === timeDraft.client_id) || active;
        const ensuredClient = isSupabase ? await ensureClientDbId(selectedClient) : selectedClient;
        const scheduleClientId = getClientScheduleId(ensuredClient);
        if (!scheduleClientId) {
          setTimeError('Select a logged client for THE.THICCENS.');
          return;
        }
        payload = {
          ...payload,
          entry_type: 'client',
          client_id: scheduleClientId,
          client_name: ensuredClient.name || 'THICC CLIENT',
          color_option_key: getClientScheduleColorKey(ensuredClient.clientColorOptionKey || 'cobalt'),
        };
      }
      if (editingEntryId) payload.id = editingEntryId;
      payload.updated_at = new Date().toISOString();
      const validationError = validateScheduleEntry(payload);
      if (validationError) {
        setTimeError(validationError);
        return;
      }
      const savedEntry = normalizeScheduleEntry(await saveScheduleEntry(payload));
      const flattened = Object.values(previousEntries).flat().filter((entry) => entry.id !== savedEntry.id);
      setEntriesByDate(groupScheduleEntriesByDate([...flattened, savedEntry]));
      await loadTimeEntries();
      const cloudSave = await flushAllPendingSaves();
      setTimeError(cloudSave?.ok ? '' : 'SCHEDULE SAVED ON THIS DEVICE; CLOUD SYNC IS RETRYING.');
      setSelectedTimeDate(savedEntry.entry_date);
      closeTimeEditor();
    } catch (error) {
      logThiccTimeDiagnostic('saveTimeDraft', 'schedule load', error);
      setEntriesByDate(previousEntries);
      setTimeError(error?.message || 'Unable to save THICC.TIME entry.');
    } finally {
      setTimeActionStatus('idle');
    }
  };
  const deleteTimeDraft = async () => {
    if (!editingEntryId) return;
    const previousEntries = entriesByDate;
    try {
      setTimeError('');
      setTimeActionStatus('saving');
      await deleteScheduleEntry(editingEntryId);
      await loadTimeEntries();
      closeTimeEditor();
    } catch (error) {
      logThiccTimeDiagnostic('deleteTimeDraft', 'schedule load', error);
      setEntriesByDate(previousEntries);
      setTimeError('Unable to delete THICC.TIME entry.');
    } finally {
      setTimeActionStatus('idle');
    }
  };

  const timeContent = <>
      <h3>THICC.TIME</h3>
      <div className="time-calendar-shell">
        <p className="time-selected-date">SELECTED DATE: {formatDisplayDate(safeSelectedTimeDate)}</p>
        <ChaoticaMonthCalendar
          viewDate={viewDate}
          selectedDateKey={safeSelectedTimeDate}
          entriesByDate={visibleEntriesByDate}
          onMonthChange={(next, nextDateKey) => { setViewDate(next || new Date()); setSelectedTimeDate(isLocalIsoDateKey(nextDateKey) ? nextDateKey : getTodayDateKey()); }}
          onSelectDate={(dateKey) => openNewEditor(dateKey)}
          onEntryClick={(entry) => openEditor(resolveEditableEntry(entry))}
          getEntryLabel={(entry) => getChipLabel(entry)}
          getEntryColor={(entry) => entryColor(entry)}
          getEntryTextColor={(entry) => entry.schedule_layer === 'new_client' ? '#120014' : '#fff'}
          maxEntriesPerDay={6}
          previousLabel="PREV"
          nextLabel="NEXT"
          classNames={{
            monthRow: 'time-month-nav',
            weekdays: 'time-weekdays',
            grid: 'month',
            day: 'day',
            selectedDay: 'selected',
            outsideDay: 'outside',
            dayNumber: 'time-day-num',
            entryStack: 'day-entry-stack',
            entryChip: 'booking',
            moreChip: 'booking-more',
          }}
        />
        <section className="time-day-panel" aria-label="Selected THICC.TIME day entries">
          <div>
            <strong>{formatDisplayDate(safeSelectedTimeDate)} ENTRIES</strong>
            <p>{selectedDayEntries.length ? `${selectedDayEntries.length} SAVED` : 'NO ENTRIES YET'}</p>
          </div>
          <button type="button" onClick={() => openNewEditor(safeSelectedTimeDate)}>ADD ENTRY</button>
          <div className="time-day-entry-list">
            {selectedDayEntries.map((entry) => <button type="button" key={`${entry.id}-${entry.entry_date}`} className="time-day-entry" onClick={() => openEditor(resolveEditableEntry(entry))} style={{ borderLeftColor: entryColor(entry) }}>
              <span style={{ color: entryColor(entry) }}>{entry.start_time || 'NO TIME'}{entry.end_time ? `–${entry.end_time}` : ''}</span>
              <strong>{getChipLabel(entry)}</strong>
              <small>{[entry.workout_label, entry.derived_recurrence ? 'WEEKLY' : '', entry.location, entry.notes].filter(Boolean).join(' • ') || 'SCHEDULE ENTRY'}</small>
            </button>)}
          </div>
        </section>
        {editorOpen && timeDraft.entry_date ? <div className="time-editor">
          <div className="time-editor-head">
            <strong>{editingEntryId ? 'EDIT ENTRY' : 'NEW ENTRY'} — {formatDisplayDate(timeDraft.entry_date)}</strong>
            <button type="button" onClick={closeTimeEditor}>CANCEL</button>
          </div>
          <div className="remember-existing-items time-existing-items">
            {(visibleEntriesByDate[timeDraft.entry_date] || []).map((entry) => <button type="button" key={entry.id} className={editingEntryId === entry.id ? 'active' : ''} onClick={() => openEditor(resolveEditableEntry(entry))}>{getChipLabel(entry)} {entry.start_time ? `• ${entry.start_time}` : ''}</button>)}
          </div>
          <div className="form-grid">
            <label>ENTRY TYPE<select value={timeDraft.schedule_layer || 'mista_thicc'} onChange={(e) => { const layer = e.target.value; const nextClient = safeClients.find((client) => getClientScheduleId(client) === timeDraft.client_id) || active; setTimeDraft((prev) => ({ ...prev, schedule_layer: layer, entry_type: layer === 'the_thiccens' ? 'client' : 'personal', client_id: layer === 'the_thiccens' ? getClientScheduleId(nextClient) : null, client_name: layer === 'the_thiccens' ? (nextClient?.name || '') : '', color_option_key: layer === 'mista_thicc' ? 'mista-thicc-pink' : getClientScheduleColorKey(nextClient?.clientColorOptionKey || 'cobalt') })); }}><option value="mista_thicc">PERSONAL</option><option value="the_thiccens">CLIENT</option></select></label>
            {timeDraft.schedule_layer === 'the_thiccens' ? <label>CLIENT<select value={timeDraft.client_id || ''} onChange={(e) => { const nextClient = safeClients.find((client) => getClientScheduleId(client) === e.target.value); setTimeDraft((prev) => ({ ...prev, client_id: e.target.value || '', client_name: nextClient?.name || '', color_option_key: getClientScheduleColorKey(nextClient?.clientColorOptionKey || 'cobalt') })); }}><option value="">{hasRealClients ? 'SELECT CLIENT' : 'NO CLIENTS AVAILABLE'}</option>{safeClients.map((client) => { const scheduleId = getClientScheduleId(client); return <option key={client.id} value={scheduleId || ''} disabled={!scheduleId}>{displayClientName(client)}</option>; })}</select><small>{hasRealClients ? 'CLIENT ENTRIES STAY IN THICC.TIME.' : 'EMPTY CLIENT LIST: PERSONAL ENTRIES STILL SAVE.'}</small></label> : null}
            <label>START TIME<input type="time" value={timeDraft.start_time || ''} onChange={(e) => setTimeDraft((prev) => ({ ...prev, start_time: e.target.value }))} /></label>
            <label>END TIME<input type="time" value={timeDraft.end_time || ''} onChange={(e) => setTimeDraft((prev) => ({ ...prev, end_time: e.target.value }))} /></label>
            <label>{timeDraft.schedule_layer === 'new_client' ? 'MEETUP LABEL' : 'WORKOUT LABEL'}<input value={timeDraft.workout_label || ''} onChange={(e) => setTimeDraft((prev) => ({ ...prev, workout_label: e.target.value }))} /></label>
            <label>LOCATION<input value={timeDraft.location || ''} onChange={(e) => setTimeDraft((prev) => ({ ...prev, location: e.target.value }))} /></label>
            <label>NOTES<textarea value={timeDraft.notes || ''} onChange={(e) => setTimeDraft((prev) => ({ ...prev, notes: e.target.value }))} /></label>
            <label>REPEAT<select value={timeDraft.recurrence_type || 'none'} onChange={(e) => setTimeDraft((prev) => ({ ...prev, recurrence_type: e.target.value, recurrence_active: e.target.value === 'weekly', recurrence_days: e.target.value === 'weekly' && !prev.recurrence_days?.length ? [days[new Date(`${prev.entry_date}T12:00:00`).getDay()].toLowerCase()] : prev.recurrence_days || [] }))}><option value="none">DOES NOT REPEAT</option><option value="weekly">WEEKLY</option></select></label>
            {timeDraft.recurrence_type === 'weekly' ? <fieldset className="weekday-grid"><legend>REPEAT ON</legend>{days.map((day) => { const key = day.toLowerCase(); const activeDay = timeDraft.recurrence_days?.includes(key); return <button type="button" key={key} className={`weekday-pill ${activeDay ? 'active' : ''}`} onClick={() => setTimeDraft((prev) => ({ ...prev, recurrence_active: true, recurrence_days: activeDay ? (prev.recurrence_days || []).filter((value) => value !== key) : [...(prev.recurrence_days || []), key] }))}>{day}</button>; })}</fieldset> : null}
          </div>
          <div className="form-row time-editor-actions">
            <button type="button" disabled={timeActionStatus === 'saving'} onClick={saveTimeDraft}>SAVE</button>
            {editingEntryId ? <button type="button" disabled={timeActionStatus === 'saving'} onClick={deleteTimeDraft}>DELETE</button> : null}
            <button type="button" onClick={closeTimeEditor}>CANCEL</button>
          </div>
        </div> : null}
      </div>
      {timeLoadStatus === 'loading' ? <p>LOADING…</p> : null}
      {timeError ? <p className="time-error">{timeError}</p> : null}
      <p className="assurer-preview">ASSURER 7-DAY READY: {assurerPayloadPreview.entries.length}</p>
    </>;

  const timeShelves = [{ id: 'time', columns: 1, panels: [{ id: 't1', token: 'ultra', content: timeContent }] }];
  const nomoShelves = [{ id: 'nomo', columns: 1, panels: [{ id: 'n1', token: 'medium', content: <><h3>THICC.NOMO</h3><p>Deactivate/archive current client from active roster.</p><button onClick={() => { if (!window.confirm('THICC.NOMO this client?')) return; const nextClients = clients.map((c) => (c.id === active.id ? { ...c, active: false } : c)); persist(nextClients, 'client:nomo'); const nextActive = nextClients.find((c) => c.active !== false); setActiveId(nextActive?.id || ''); setActiveTab('THICC.INFO'); }}>THICC.NOMO</button></> }] }];

  const shelves = activeTab === 'THICC.INFO' ? infoShelves : activeTab === 'THICC.PEOPLE' ? peopleShelves : activeTab === 'THICC.FORMS' ? formsShelves : activeTab === 'THICC.TIME' ? timeShelves : nomoShelves;
  return <SectionShell className="igtv2-page"><ScenePlate className="igtv2-scene-plate"><div className="igtv2-bg" /></ScenePlate><SectionOverlay><ArtLane className="igtv2-left"><div className="igtv2-cabinet">{tabs.map((tab) => <button key={tab} className={`igtv2-cabinet-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div></ArtLane><ContentScroller><BlueprintStack shelves={shelves.map((s) => s.id === 'time' ? ({ ...s, panels: s.panels.map((p) => ({ ...p, className: 'igtv2-time-panel' })) }) : s)} /></ContentScroller></SectionOverlay></SectionShell>;
}
