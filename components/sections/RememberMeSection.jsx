'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/remember-me.css';

const EVENT_TYPES = ['SOMETHING NEW DAY','TREAT DAY','REMINDER','JOB INTERVIEW','BIRTHDAY','ANNIVERSARY','MEETING','DEADLINE','EVENT (WORK)','TRAVEL','CALL','DICK APPOINTMENT','SOCIAL NETWORKING','DATE','HEALTH','RENT','PACKAGE DELIVERY','HAIRCUT'];
const WEEKDAY_HEADERS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const WEEKDAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];
const STANDOUT_TYPES = ['WOW', 'WTF', 'PLOT TWIST'];
const REMEMBER_MOMENT_BACKS = { WOW: '', WTF: '', 'PLOT TWIST': '' };
const formatDisplayDate = (value) => { if (!value) return ''; if (typeof value==='string'&&value.includes('-')) { const [y,m,d]=value.split('-'); return `${m}/${d}/${y}`; } const n=new Date(value); if (Number.isNaN(n.getTime())) return ''; return `${String(n.getMonth()+1).padStart(2,'0')}/${String(n.getDate()).padStart(2,'0')}/${n.getFullYear()}`; };
const daysInMonth = (y,m)=> new Date(y,m+1,0).getDate();
const safeDateKey = (y,m,d) => { const dim = daysInMonth(y,m); if (!Number.isInteger(d) || d < 1) return null; const safeDay = Math.min(d, dim); return `${y}-${String(m+1).padStart(2,'0')}-${String(safeDay).padStart(2,'0')}`; };

export default function RememberMeSection() {
  const [viewDate, setViewDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [entriesByDate, setEntriesByDate] = useState({});
  const [error, setError] = useState('');
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [entryDraft, setEntryDraft] = useState({ type: EVENT_TYPES[0], time: '', detail: '', description: '', recurrence_type: 'none', recurrence_days: [], recurrence_active: false });
  const [momentDraft, setMomentDraft] = useState({ type: STANDOUT_TYPES[0], time: '', detail: '', description: '', mediaRef: '', persistedMediaRef: '' });
  const selectedDateKey = useMemo(() => safeDateKey(viewDate.getFullYear(), viewDate.getMonth(), selectedDay), [viewDate, selectedDay]);

  useEffect(() => { (async () => { const mod = await import('../../src/services/rememberMeService'); const result = await mod.fetchRememberMeEntriesSafe(); const grouped = (result.rows || []).reduce((acc, row) => { if (!row.date_key) return acc; const next = { id: row.id, type: row.entry_type, time: row.time_value || '', detail: row.detail || '', description: row.description || '', recurrence_type: row.recurrence_type || 'none', recurrence_days: Array.isArray(row.recurrence_days) ? row.recurrence_days : [], recurrence_active: Boolean(row.recurrence_active) }; acc[row.date_key] = [...(acc[row.date_key] || []), next]; return acc; }, {}); setEntriesByDate(grouped); })(); }, []);

  const monthGrid = useMemo(() => {
    const y = viewDate.getFullYear(); const m = viewDate.getMonth(); const first = new Date(y,m,1).getDay(); const dim = daysInMonth(y,m); const dip = daysInMonth(y,m-1);
    const cells=[]; for (let i=first-1;i>=0;i--) cells.push({day:dip-i,inMonth:false}); for (let d=1; d<=dim; d++) cells.push({day:d,inMonth:true}); let nextMonthDay = 1; while (cells.length%7!==0) { cells.push({ day: nextMonthDay, inMonth:false }); nextMonthDay += 1; } return cells;
  }, [viewDate]);

  const shiftMonth = (delta) => {
    setViewDate((cur) => {
      const y = cur.getFullYear(); const m = cur.getMonth() + delta; const next = new Date(y, m, 1);
      const clamped = Math.min(selectedDay, daysInMonth(next.getFullYear(), next.getMonth()));
      setSelectedDay(clamped);
      return next;
    });
  };

  const saveEntry = async () => {
    setError('');
    if (!selectedDateKey) { console.error('REMEMBER.ME invalid date blocked', { viewDate, selectedDay }); setError('Invalid date.'); return; }
    if (entryDraft.recurrence_type === 'weekly' && !entryDraft.time) { setError('Set Event time first.'); return; }
    const payload = { ...entryDraft, id: crypto.randomUUID(), date_key: selectedDateKey };
    const snapshot = entriesByDate;
    const optimistic = { ...entriesByDate, [selectedDateKey]: [...(entriesByDate[selectedDateKey] || []), payload] };
    setEntriesByDate(optimistic);
    try {
      const mod = await import('../../src/services/rememberMeService');
      await mod.upsertRememberMeEntry({ id: payload.id, date_key: selectedDateKey, entry_type: payload.type, time_value: payload.time, detail: payload.detail, description: payload.description, recurrence_type: payload.recurrence_type, recurrence_days: payload.recurrence_days, recurrence_active: payload.recurrence_active });
      setPostcardOpen(false);
    } catch (e) { console.error('REMEMBER.ME save failed', e); setEntriesByDate(snapshot); setError('Save failed. Try again.'); }
  };

  const onLibraryUpload = (event) => { const file = event.target.files?.[0]; if (!file) return; const objectUrl = URL.createObjectURL(file); setMomentDraft((d) => ({ ...d, mediaRef: objectUrl })); };

  return <section className="remember-page"><div className="remember-content"><section className="remember-calendar-panel"><div className="remember-month-row"><button type="button" onClick={() => shiftMonth(-1)}>‹</button><strong>{viewDate.toLocaleString('en-US',{month:'long',year:'numeric'}).toUpperCase()}</strong><button type="button" onClick={() => shiftMonth(1)}>›</button></div><div className="remember-weekdays">{WEEKDAY_HEADERS.map((d) => <span key={d}>{d}</span>)}</div><div className="remember-grid">{monthGrid.map((cell, idx) => <button key={`${idx}-${cell.day}`} type="button" className={`remember-day ${!cell.inMonth?'remember-outside':''}`} onClick={() => { if (cell.inMonth) { setSelectedDay(cell.day); setPostcardOpen(true); } }}><span className="remember-day-num">{cell.day}</span></button>)}</div></section>{postcardOpen ? <section className="remember-postcard-popout"><header><h3>{formatDisplayDate(selectedDateKey)}</h3><button onClick={() => setPostcardOpen(false)}>CLOSE</button></header><div className="remember-form"><label>EVENT TYPE<select value={entryDraft.type} onChange={(e)=>setEntryDraft((d)=>({...d,type:e.target.value}))}>{EVENT_TYPES.map((type)=><option key={type} value={type}>{type}</option>)}</select></label><label>EVENT TIME<input type="time" value={entryDraft.time} onChange={(e)=>setEntryDraft((d)=>({...d,time:e.target.value}))} /></label><label>SCHEDULE<select value={entryDraft.recurrence_type==='weekly'?'weekly':'none'} onChange={(e)=>setEntryDraft((d)=>({ ...d, recurrence_type: e.target.value==='weekly' ? 'weekly' : 'none', recurrence_active: e.target.value==='weekly', recurrence_days: e.target.value==='weekly' ? d.recurrence_days : [] }))}><option value="none">ONE AND DONE</option><option value="weekly">RECURRING</option></select></label>{entryDraft.recurrence_type==='weekly'?<div className="remember-weekday-picks">{WEEKDAY_KEYS.map((wk)=> <button type="button" key={wk} className={entryDraft.recurrence_days.includes(wk)?'active':''} onClick={()=>setEntryDraft((d)=>({ ...d, recurrence_days: d.recurrence_days.includes(wk) ? d.recurrence_days.filter((x)=>x!==wk) : [...d.recurrence_days,wk] }))}>{wk.toUpperCase()}</button>)}</div>:null}<input type="text" placeholder="LOCATION" value={entryDraft.detail} onChange={(e)=>setEntryDraft((d)=>({...d,detail:e.target.value}))} /><textarea placeholder="DESCRIPTION" value={entryDraft.description} onChange={(e)=>setEntryDraft((d)=>({...d,description:e.target.value}))} /><label>UPLOAD FROM LIBRARY<input type="file" accept="image/*" onChange={onLibraryUpload} /></label>{momentDraft.mediaRef?<img src={momentDraft.mediaRef} alt="preview"/>:null}<div className="remember-actions"><button onClick={saveEntry}>SAVE</button><button onClick={() => setPostcardOpen(false)}>CLOSE</button></div>{error ? <p className="time-error">{error}</p> : null}</div></section>:null}</div></section>;
}

export { REMEMBER_MOMENT_BACKS, formatDisplayDate };
