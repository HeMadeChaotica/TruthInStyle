'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/remember-me.css';

const EVENT_TYPES = ['SOMETHING NEW DAY','TREAT DAY','REMINDER','JOB INTERVIEW','BIRTHDAY','ANNIVERSARY','MEETING','DEADLINE','EVENT (WORK)','TRAVEL','CALL','DICK APPOINTMENT','SOCIAL NETWORKING','DATE','HEALTH','RENT','PACKAGE DELIVERY','HAIRCUT'];
const STANDOUT_TYPES = ['WOW', 'WTF', 'PLOT TWIST'];
const REMEMBER_MOMENT_BACKS = { WOW: '', WTF: '', 'PLOT TWIST': '' };
const MOMENTS_STORAGE_KEY = 'remember_me_standout_moments_v1';

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

const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const safeDateKey = (y, m, d) => {
  const dim = daysInMonth(y, m);
  if (!Number.isInteger(d) || d < 1) return null;
  const safeDay = Math.min(d, dim);
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
};

export default function RememberMeSection() {
  const [viewDate, setViewDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [entriesByDate, setEntriesByDate] = useState({});
  const [momentByDate, setMomentByDate] = useState({});
  const [error, setError] = useState('');
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('EVENT');
  const [entryDraft, setEntryDraft] = useState({ type: EVENT_TYPES[0], time: '', detail: '', description: '' });
  const [momentDraft, setMomentDraft] = useState({ type: STANDOUT_TYPES[0], time: '', detail: '', description: '', mediaRef: '', persistedMediaRef: '' });
  const selectedDateKey = useMemo(() => safeDateKey(viewDate.getFullYear(), viewDate.getMonth(), selectedDay), [viewDate, selectedDay]);

  useEffect(() => {
    (async () => {
      const mod = await import('../../src/services/rememberMeService');
      const result = await mod.fetchRememberMeEntriesSafe();
      const grouped = (result.rows || []).reduce((acc, row) => {
        if (!row.date_key) return acc;
        const next = { id: row.id, type: row.entry_type, time: row.time_value || '', detail: row.detail || '', description: row.description || '' };
        acc[row.date_key] = [...(acc[row.date_key] || []), next];
        return acc;
      }, {});
      setEntriesByDate(grouped);
      try {
        setMomentByDate(JSON.parse(localStorage.getItem(MOMENTS_STORAGE_KEY) || '{}'));
      } catch {
        setMomentByDate({});
      }
    })();
  }, []);

  const monthGrid = useMemo(() => {
    const y = viewDate.getFullYear(); const m = viewDate.getMonth(); const first = new Date(y, m, 1).getDay(); const dim = daysInMonth(y, m); const dip = daysInMonth(y, m - 1);
    const cells = [];
    for (let i = first - 1; i >= 0; i -= 1) cells.push({ day: dip - i, inMonth: false });
    for (let d = 1; d <= dim; d += 1) cells.push({ day: d, inMonth: true });
    let nextMonthDay = 1;
    while (cells.length % 7 !== 0) {
      cells.push({ day: nextMonthDay, inMonth: false });
      nextMonthDay += 1;
    }
    return cells;
  }, [viewDate]);

  const shiftMonth = (delta) => {
    setViewDate((cur) => {
      const next = new Date(cur.getFullYear(), cur.getMonth() + delta, 1);
      setSelectedDay((prev) => Math.min(prev, daysInMonth(next.getFullYear(), next.getMonth())));
      return next;
    });
  };

  const saveEntry = async () => {
    setError('');
    if (!selectedDateKey) { console.error('REMEMBER.ME invalid date blocked', { viewDate, selectedDay }); setError('Invalid date.'); return; }
    const payload = { ...entryDraft, id: crypto.randomUUID(), date_key: selectedDateKey };
    const snapshot = entriesByDate;
    setEntriesByDate({ ...entriesByDate, [selectedDateKey]: [...(entriesByDate[selectedDateKey] || []), payload] });
    try {
      const mod = await import('../../src/services/rememberMeService');
      await mod.upsertRememberMeEntry({ id: payload.id, date_key: selectedDateKey, entry_type: payload.type, time_value: payload.time, detail: payload.detail, description: payload.description });
      setPostcardOpen(false);
    } catch (backendError) {
      console.error(backendError);
      setEntriesByDate(snapshot);
      setError('Save failed. Try again.');
    }
  };

  const stampMoment = () => {
    setError('');
    if (!selectedDateKey) { setError('Invalid date.'); return; }
    const dayList = momentByDate[selectedDateKey] || [];
    if (dayList.length >= 3) { setError('Max 3 Standouts per day.'); return; }
    const durableRef = momentDraft.persistedMediaRef && !momentDraft.persistedMediaRef.startsWith('blob:') ? momentDraft.persistedMediaRef : '';
    const nextMoment = { ...momentDraft, id: crypto.randomUUID(), standoutType: momentDraft.type, stamped: true, mediaRef: durableRef, photoRef: durableRef };
    const nextState = { ...momentByDate, [selectedDateKey]: [...dayList, nextMoment] };
    setMomentByDate(nextState);
    localStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(nextState));
    setPostcardOpen(false);
  };

  const onLibraryUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setMomentDraft((d) => ({ ...d, mediaRef: objectUrl, persistedMediaRef: '' }));
    setError('Image preview only. Durable upload unavailable.');
  };

  return <section className="remember-page"><div className="remember-content"><section className="remember-calendar-panel"><div className="remember-month-row"><button type="button" onClick={() => shiftMonth(-1)}>‹</button><strong>{viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}</strong><button type="button" onClick={() => shiftMonth(1)}>›</button></div><div className="remember-weekdays">{['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d) => <span key={d}>{d}</span>)}</div><div className="remember-grid">{monthGrid.map((cell, idx) => <button key={`${idx}-${cell.day}`} type="button" className={`remember-day ${!cell.inMonth ? 'remember-outside' : ''}`} onClick={() => { if (cell.inMonth) { setSelectedDay(cell.day); setPostcardOpen(true); } }}><span className="remember-day-num">{cell.day}</span></button>)}</div></section>{postcardOpen ? <section className="remember-postcard-popout"><header><h3>{formatDisplayDate(selectedDateKey)}</h3><button type="button" onClick={() => setPostcardOpen(false)}>CLOSE</button></header><div className="remember-type-switch"><button type="button" className={editorMode === 'EVENT' ? 'active' : ''} onClick={() => setEditorMode('EVENT')}>EVENT</button><button type="button" className={editorMode === 'STANDOUT' ? 'active' : ''} onClick={() => setEditorMode('STANDOUT')}>STANDOUT</button></div><div className="remember-form">{editorMode === 'EVENT' ? <><label>EVENT TYPE<select value={entryDraft.type} onChange={(e)=>setEntryDraft((d)=>({...d,type:e.target.value}))}>{EVENT_TYPES.map((type)=><option key={type} value={type}>{type}</option>)}</select></label><label>TIME<input type="time" value={entryDraft.time} onChange={(e)=>setEntryDraft((d)=>({...d,time:e.target.value}))} /></label><label>LOCATION<input type="text" value={entryDraft.detail} onChange={(e)=>setEntryDraft((d)=>({...d,detail:e.target.value}))} /></label><label>DESCRIPTION<textarea value={entryDraft.description} onChange={(e)=>setEntryDraft((d)=>({...d,description:e.target.value}))} /></label><div className="remember-actions"><button type="button" onClick={saveEntry}>SAVE</button><button type="button">DELETE</button><button type="button" onClick={() => setPostcardOpen(false)}>CLOSE</button></div></> : <><label>WOW / WTF / PLOT TWIST<select value={momentDraft.type} onChange={(e)=>setMomentDraft((d)=>({...d,type:e.target.value}))}>{STANDOUT_TYPES.map((type)=><option key={type} value={type}>{type}</option>)}</select></label><label>TIME<input type="time" value={momentDraft.time} onChange={(e)=>setMomentDraft((d)=>({...d,time:e.target.value}))} /></label><label>LOCATION<input type="text" value={momentDraft.detail} onChange={(e)=>setMomentDraft((d)=>({...d,detail:e.target.value}))} /></label><label>DESCRIPTION<textarea value={momentDraft.description} onChange={(e)=>setMomentDraft((d)=>({...d,description:e.target.value}))} /></label><label>PHOTO / IMAGE<input type="file" accept="image/*" onChange={onLibraryUpload} /></label>{momentDraft.mediaRef ? <div className="remember-moment-photo-preview"><img src={momentDraft.mediaRef} alt="preview" /></div> : null}<div className="remember-actions"><button type="button" onClick={stampMoment}>STAMP IT</button><button type="button">DELETE</button><button type="button" onClick={() => setPostcardOpen(false)}>CLOSE</button></div></>}{error ? <p className="time-error">{error}</p> : null}</div></section> : null}</div></section>;
}

export { REMEMBER_MOMENT_BACKS, formatDisplayDate };
