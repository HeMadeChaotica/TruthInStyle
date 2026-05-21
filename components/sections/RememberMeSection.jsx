'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/remember-me.css';

const EVENT_TYPES = ['SOMETHING NEW DAY','TREAT DAY','REMINDER','JOB INTERVIEW','BIRTHDAY','ANNIVERSARY','MEETING','DEADLINE','EVENT (WORK)','TRAVEL','CALL','DICK APPOINTMENT','SOCIAL NETWORKING','DATE','HEALTH','RENT','PACKAGE DELIVERY','HAIRCUT'];
const STANDOUT_TYPES = ['WOW', 'WTF', 'PLOT TWIST'];
const REMEMBER_MOMENT_BACKS = { WOW: '', WTF: '', 'PLOT TWIST': '' };
const MOMENTS_STORAGE_KEY = 'remember_me_standout_moments_v1';

const MONTH_BACKGROUNDS = {
  0: '/backgrounds/REMEMBER-ME/january.png',
  1: '/backgrounds/REMEMBER-ME/february.png',
  2: '/backgrounds/REMEMBER-ME/march.png',
  3: '/backgrounds/REMEMBER-ME/april.png',
  4: '/backgrounds/REMEMBER-ME/may.png',
  5: '/backgrounds/REMEMBER-ME/june.png',
  6: '/backgrounds/REMEMBER-ME/july.png',
  7: '/backgrounds/REMEMBER-ME/august.png',
  8: '/backgrounds/REMEMBER-ME/september.png',
  9: '/backgrounds/REMEMBER-ME/october.png',
  10: '/backgrounds/REMEMBER-ME/november.png',
  11: '/backgrounds/REMEMBER-ME/december.png',
};

const readStoredMoments = () => {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(MOMENTS_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.warn('REMEMBER.ME moments storage parse failed', error);
    return {};
  }
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
  const [momentByDate, setMomentByDate] = useState(readStoredMoments);
  const [error, setError] = useState('');
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('EVENT');
  const [entryDraft, setEntryDraft] = useState({ type: EVENT_TYPES[0], time: '', detail: '', description: '' });
  const [momentDraft, setMomentDraft] = useState({ type: STANDOUT_TYPES[0], time: '', detail: '', description: '', mediaRef: '', persistedMediaRef: '' });
  const selectedDateKey = useMemo(() => safeDateKey(viewDate.getFullYear(), viewDate.getMonth(), selectedDay), [viewDate, selectedDay]);
  const currentEntries = selectedDateKey ? (entriesByDate[selectedDateKey] || []) : [];
  const currentMoments = selectedDateKey ? (momentByDate[selectedDateKey] || []) : [];
  const bgSrc = MONTH_BACKGROUNDS[viewDate.getMonth()] || '';

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
    })();
  }, []);

  const shiftMonth = (delta) => {
    setViewDate((cur) => {
      const next = new Date(cur.getFullYear(), cur.getMonth() + delta, 1);
      setSelectedDay((prev) => Math.min(prev, daysInMonth(next.getFullYear(), next.getMonth())));
      return next;
    });
  };

  const saveEntry = async () => {
    setError('');
    if (!selectedDateKey) { setError('Invalid date.'); return; }
    const id = entryDraft.id || crypto.randomUUID();
    const payload = { ...entryDraft, id, date_key: selectedDateKey };
    const snapshot = entriesByDate;
    const dayEntries = entriesByDate[selectedDateKey] || [];
    const nextDayEntries = entryDraft.id ? dayEntries.map((entry) => (entry.id === entryDraft.id ? payload : entry)) : [...dayEntries, payload];
    setEntriesByDate({ ...entriesByDate, [selectedDateKey]: nextDayEntries });
    try {
      const mod = await import('../../src/services/rememberMeService');
      await mod.upsertRememberMeEntry({ id: payload.id, date_key: selectedDateKey, entry_type: payload.type, time_value: payload.time, detail: payload.detail, description: payload.description });
      setPostcardOpen(false);
      setEntryDraft({ type: EVENT_TYPES[0], time: '', detail: '', description: '' });
    } catch (backendError) {
      console.error('REMEMBER.ME event save failed', backendError);
      setEntriesByDate(snapshot);
      setError('Save failed. Try again.');
    }
  };

  const deleteEntry = async () => {
    if (!selectedDateKey || !entryDraft.id) return;
    const deletingId = entryDraft.id;
    const snapshot = entriesByDate;
    setError('');
    setEntriesByDate((previous) => {
      const dayEntries = previous[selectedDateKey] || [];
      return { ...previous, [selectedDateKey]: dayEntries.filter((entry) => entry.id !== deletingId) };
    });
    try {
      const mod = await import('../../src/services/rememberMeService');
      await mod.deleteRememberMeEntry(deletingId);
      setEntryDraft({ type: EVENT_TYPES[0], time: '', detail: '', description: '' });
      setPostcardOpen(false);
    } catch (backendError) {
      console.error('REMEMBER.ME event delete failed', backendError);
      setEntriesByDate(snapshot);
      setError('Delete failed. Try again.');
    }
  };

  const stampMoment = () => {
    setError('');
    if (!selectedDateKey) { setError('Invalid date.'); return; }
    const durableRef = momentDraft.persistedMediaRef && !momentDraft.persistedMediaRef.startsWith('blob:') ? momentDraft.persistedMediaRef : '';
    const isUpdate = Boolean(momentDraft.id);
    const nextMoment = { ...momentDraft, id: momentDraft.id || crypto.randomUUID(), standoutType: momentDraft.type, stamped: true, mediaRef: durableRef, photoRef: durableRef, persistedMediaRef: durableRef };

    let blockedByMax = false;
    setMomentByDate((previous) => {
      const stored = readStoredMoments();
      const merged = { ...stored, ...previous };
      const dayList = Array.isArray(merged[selectedDateKey]) ? merged[selectedDateKey] : [];
      if (!isUpdate && dayList.length >= 3) {
        blockedByMax = true;
        return previous;
      }
      const nextDayList = isUpdate ? dayList.map((moment) => (moment.id === momentDraft.id ? nextMoment : moment)) : [...dayList, nextMoment];
      const nextState = { ...merged, [selectedDateKey]: nextDayList };
      localStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(nextState));
      return nextState;
    });

    if (blockedByMax) {
      setError('Max 3 Standouts per day.');
      return;
    }

    setPostcardOpen(false);
    setMomentDraft({ type: STANDOUT_TYPES[0], time: '', detail: '', description: '', mediaRef: '', persistedMediaRef: '' });
  };

  const deleteMoment = () => {
    if (!selectedDateKey || !momentDraft.id) return;
    const deletingId = momentDraft.id;
    setError('');
    setMomentByDate((previous) => {
      const stored = readStoredMoments();
      const merged = { ...stored, ...previous };
      const dayList = Array.isArray(merged[selectedDateKey]) ? merged[selectedDateKey] : [];
      const nextState = { ...merged, [selectedDateKey]: dayList.filter((moment) => moment.id !== deletingId) };
      localStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(nextState));
      return nextState;
    });
    setMomentDraft({ type: STANDOUT_TYPES[0], time: '', detail: '', description: '', mediaRef: '', persistedMediaRef: '' });
    setPostcardOpen(false);
  };

  const monthGrid = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const first = new Date(y, m, 1).getDay();
    const dim = daysInMonth(y, m);
    const dip = daysInMonth(y, m - 1);
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

  return (
    <section className="remember-page">
      <div className="remember-scene-frame">
        {bgSrc ? <img className="remember-bg-img" src={bgSrc} alt="" onError={() => console.warn('REMEMBER.ME background missing', bgSrc)} /> : null}
        <div className="remember-overlay" />
      </div>
      <div className="remember-content">
        <main className="remember-main">
          <section className="remember-calendar-panel">
            <div className="remember-month-row"><button type="button" onClick={() => shiftMonth(-1)}>‹</button><strong>{viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}</strong><button type="button" onClick={() => shiftMonth(1)}>›</button></div>
            <div className="remember-weekdays">{['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d) => <span key={d}>{d}</span>)}</div>
            <div className="remember-grid">{monthGrid.map((cell, idx) => <button key={`${idx}-${cell.day}`} type="button" className={`remember-day ${!cell.inMonth ? 'remember-outside' : ''}`} onClick={() => { if (cell.inMonth) { setSelectedDay(cell.day); setPostcardOpen(true); } }}><span className="remember-day-num">{cell.day}</span></button>)}</div>
          </section>

          {postcardOpen ? <section className="remember-postcard-popout"><header><h3>{formatDisplayDate(selectedDateKey)}</h3><button type="button" onClick={() => setPostcardOpen(false)}>CLOSE</button></header><div className="remember-type-switch"><button type="button" className={editorMode === 'EVENT' ? 'active' : ''} onClick={() => setEditorMode('EVENT')}>EVENT</button><button type="button" className={editorMode === 'STANDOUT' ? 'active' : ''} onClick={() => setEditorMode('STANDOUT')}>STANDOUT</button></div><div className="remember-form">{editorMode === 'EVENT' ? <><div className="remember-existing-items">{currentEntries.map((entry) => <button key={entry.id} type="button" className={entryDraft.id === entry.id ? 'active' : ''} onClick={() => setEntryDraft({ ...entry })}>{entry.type} {entry.time ? `• ${entry.time}` : ''}</button>)}</div><label>EVENT TYPE<select value={entryDraft.type} onChange={(e)=>setEntryDraft((d)=>({...d,type:e.target.value}))}>{EVENT_TYPES.map((type)=><option key={type} value={type}>{type}</option>)}</select></label><label>TIME<input type="time" value={entryDraft.time} onChange={(e)=>setEntryDraft((d)=>({...d,time:e.target.value}))} /></label><label>LOCATION<input type="text" value={entryDraft.detail} onChange={(e)=>setEntryDraft((d)=>({...d,detail:e.target.value}))} /></label><label>DESCRIPTION<textarea value={entryDraft.description} onChange={(e)=>setEntryDraft((d)=>({...d,description:e.target.value}))} /></label><div className="remember-actions"><button type="button" onClick={saveEntry}>SAVE</button>{entryDraft.id ? <button type="button" onClick={deleteEntry}>DELETE</button> : null}<button type="button" onClick={() => setPostcardOpen(false)}>CLOSE</button></div></> : <><div className="remember-existing-items">{currentMoments.map((moment) => <button key={moment.id} type="button" className={momentDraft.id === moment.id ? 'active' : ''} onClick={() => setMomentDraft({ ...moment, mediaRef: moment.mediaRef || '', persistedMediaRef: moment.persistedMediaRef || moment.photoRef || '' })}>{moment.type || moment.standoutType} {moment.time ? `• ${moment.time}` : ''}</button>)}</div><label>WOW / WTF / PLOT TWIST<select value={momentDraft.type} onChange={(e)=>setMomentDraft((d)=>({...d,type:e.target.value}))}>{STANDOUT_TYPES.map((type)=><option key={type} value={type}>{type}</option>)}</select></label><label>TIME<input type="time" value={momentDraft.time} onChange={(e)=>setMomentDraft((d)=>({...d,time:e.target.value}))} /></label><label>LOCATION<input type="text" value={momentDraft.detail} onChange={(e)=>setMomentDraft((d)=>({...d,detail:e.target.value}))} /></label><label>DESCRIPTION<textarea value={momentDraft.description} onChange={(e)=>setMomentDraft((d)=>({...d,description:e.target.value}))} /></label><label>PHOTO / IMAGE<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const objectUrl = URL.createObjectURL(file); setMomentDraft((d) => ({ ...d, mediaRef: objectUrl, persistedMediaRef: '' })); setError('Image preview only. Durable upload unavailable.'); }} /></label>{momentDraft.mediaRef ? <div className="remember-moment-photo-preview"><img src={momentDraft.mediaRef} alt="preview" /></div> : null}<div className="remember-actions"><button type="button" onClick={stampMoment}>STAMP IT</button>{momentDraft.id ? <button type="button" onClick={deleteMoment}>DELETE</button> : null}<button type="button" onClick={() => setPostcardOpen(false)}>CLOSE</button></div></>}{error ? <p className="time-error">{error}</p> : null}</div></section> : null}
        </main>
      </div>
    </section>
  );
}

export { REMEMBER_MOMENT_BACKS, formatDisplayDate };
