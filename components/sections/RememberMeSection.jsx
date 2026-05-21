'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/remember-me.css';

const EVENT_TYPES = ['SOMETHING NEW DAY','TREAT DAY','REMINDER','JOB INTERVIEW','BIRTHDAY','ANNIVERSARY','MEETING','DEADLINE','EVENT (WORK)','TRAVEL','CALL','DICK APPOINTMENT','SOCIAL NETWORKING','DATE','HEALTH','RENT','PACKAGE DELIVERY','HAIRCUT'];
const STANDOUT_TYPES = ['WOW', 'WTF', 'PLOT TWIST'];
const REMEMBER_MOMENT_BACKS = { WOW: '', WTF: '', 'PLOT TWIST': '' };
const MOMENTS_STORAGE_KEY = 'remember_me_standout_moments_v1';

const MONTH_BACKGROUND_BY_INDEX = {
  0: 'remember-me-01-january-new-year-bg.jpeg',
  1: 'remember-me-02-february-valentine-bg.png',
  2: 'remember-me-03-march-steak-and-bj-day-bg.jpeg',
  3: 'remember-me-04-april-spring-bg.png',
  4: 'remember-me-05-may-summer-loading-bg.png',
  5: 'remember-me-06-june-pride-bg.png',
  6: 'remember-me-07-july-hotter-than-your-ex-bg.png',
  7: 'remember-me-08-august-peak-thicc-bg.png',
  8: 'remember-me-09-september-back-to-business-bg.png',
  9: 'remember-me-10-october-spooky-sexy-bg.png',
  10: 'remember-me-11-november-feast-bg.jpeg',
  11: 'remember-me-12-december-mista-thicc-birthday-bg.jpeg'
};

const REMEMBER_MONTH_VISUALS = {
  0: { key: 'january', bgFit: 'cover', bgPosition: 'center center' },
  1: { key: 'february', bgFit: 'cover', bgPosition: 'center center' },
  2: { key: 'march', bgFit: 'cover', bgPosition: 'center center' },
  3: { key: 'april', bgFit: 'cover', bgPosition: 'center center' },
  4: { key: 'may', bgFit: 'cover', bgPosition: 'center center' },
  5: { key: 'june', bgFit: 'cover', bgPosition: 'center center' },
  6: { key: 'july', bgFit: 'cover', bgPosition: 'center center' },
  7: { key: 'august', bgFit: 'cover', bgPosition: 'center center' },
  8: { key: 'september', bgFit: 'cover', bgPosition: 'center center' },
  9: { key: 'october', bgFit: 'cover', bgPosition: 'center center' },
  10: { key: 'november', bgFit: 'cover', bgPosition: 'center center' },
  11: { key: 'december', bgFit: 'cover', bgPosition: 'center center' }
};

const REMEMBER_MONTH_CALENDAR_PINS = {
  0: { key: 'january', calendarRight: '4.8%', calendarBottom: '7.2%', calendarWidth: '39.5%', calendarMaxWidth: '650px' },
  1: { key: 'february', calendarRight: '4.6%', calendarBottom: '7.4%', calendarWidth: '37.5%', calendarMaxWidth: '620px' },
  2: { key: 'march', calendarRight: '4.8%', calendarBottom: '7.2%', calendarWidth: '39%', calendarMaxWidth: '640px' },
  3: { key: 'april', calendarRight: '4.6%', calendarBottom: '7.4%', calendarWidth: '37.5%', calendarMaxWidth: '620px' },
  4: { key: 'may', calendarRight: '4.2%', calendarBottom: '7.8%', calendarWidth: '40%', calendarMaxWidth: '660px' },
  5: { key: 'june', calendarRight: '4.4%', calendarBottom: '7.6%', calendarWidth: '40%', calendarMaxWidth: '660px' },
  6: { key: 'july', calendarRight: '4.8%', calendarBottom: '7.4%', calendarWidth: '39%', calendarMaxWidth: '640px' },
  7: { key: 'august', calendarRight: '4.8%', calendarBottom: '7.6%', calendarWidth: '38%', calendarMaxWidth: '625px' },
  8: { key: 'september', calendarRight: '4.8%', calendarBottom: '7.6%', calendarWidth: '38%', calendarMaxWidth: '625px' },
  9: { key: 'october', calendarRight: '4.6%', calendarBottom: '7.4%', calendarWidth: '38.5%', calendarMaxWidth: '635px' },
  10: { key: 'november', calendarRight: '4.8%', calendarBottom: '7.4%', calendarWidth: '39.5%', calendarMaxWidth: '650px' },
  11: { key: 'december', calendarRight: '4.8%', calendarBottom: '7.4%', calendarWidth: '39.5%', calendarMaxWidth: '650px' }
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
  const monthIndex = viewDate.getMonth();
  const visual = REMEMBER_MONTH_VISUALS[monthIndex] || REMEMBER_MONTH_VISUALS[0];
  const calendarPin = REMEMBER_MONTH_CALENDAR_PINS[monthIndex] || REMEMBER_MONTH_CALENDAR_PINS[9];

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
      <div
        className="remember-scene-frame"
        style={{
          '--rm-bg-fit': visual.bgFit,
          '--rm-bg-position': visual.bgPosition,
          '--rm-calendar-right': calendarPin.calendarRight,
          '--rm-calendar-bottom': calendarPin.calendarBottom,
          '--rm-calendar-width': calendarPin.calendarWidth,
          '--rm-calendar-max-width': calendarPin.calendarMaxWidth
        }}
      >
        <img
          className="remember-bg-img"
          src={`/backgrounds/REMEMBER-ME/${MONTH_BACKGROUND_BY_INDEX[monthIndex]}`}
          alt=""
          aria-hidden="true"
          onError={() => console.warn('REMEMBER.ME background missing', `/backgrounds/REMEMBER-ME/${MONTH_BACKGROUND_BY_INDEX[monthIndex]}`)}
        />
        <div className="remember-overlay" aria-hidden="true" />
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
      </div>
    </section>
  );
}

export { REMEMBER_MOMENT_BACKS, formatDisplayDate };
