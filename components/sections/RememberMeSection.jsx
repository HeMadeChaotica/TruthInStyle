'use client';

import { useEffect, useMemo, useState } from 'react';
import '../../styles/sections/remember-me.css';

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

const REMEMBER_MOMENT_BACKS = {
  WOW: { src: '/art/REMEMBER-ME/moment-backs/wow-moment-back.png', alt: 'Mista.Thicc high-couture fashion moment back' },
  WTF: { src: '/art/REMEMBER-ME/moment-backs/wtf-moment-back.png', alt: 'Mista.Thicc luxury swimwear moment back' },
  'PLOT TWIST': { src: '/art/REMEMBER-ME/moment-backs/plot-twist-moment-back.png', alt: 'Mista.Thicc sculptural couture moment back' }
};

const formatDisplayDate = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.includes('-')) {
    const [year, month, day] = value.split('-');
    return `${month}/${day}/${year}`;
  }
  const next = new Date(value);
  if (Number.isNaN(next.getTime())) return '';
  return `${String(next.getMonth() + 1).padStart(2, '0')}/${String(next.getDate()).padStart(2, '0')}/${next.getFullYear()}`;
};
const toDateKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const buildMonthGrid = (v) => { const y = v.getFullYear(); const m = v.getMonth(); const f = new Date(y, m, 1); const w = f.getDay(); const dim = new Date(y, m + 1, 0).getDate(); const dip = new Date(y, m, 0).getDate(); const cells = []; for (let i = w - 1; i >= 0; i--) cells.push({ day: dip - i, inMonth: false, dateKey: toDateKey(y, m - 1, dip - i) }); for (let d = 1; d <= dim; d++) cells.push({ day: d, inMonth: true, dateKey: toDateKey(y, m, d) }); for (let t = 1; cells.length % 7 !== 0; t++) cells.push({ day: t, inMonth: false, dateKey: toDateKey(y, m + 1, t) }); return cells; };

const EVENT_TYPES = ['SOMETHING NEW DAY', 'APPOINTMENT', 'REMINDER'];
const STANDOUT_TYPES = ['WOW', 'WTF', 'PLOT TWIST'];
const WEEKDAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function RememberMeSection() {
  const MOMENTS_STORAGE_KEY = 'remember_me_standout_moments_v1';
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [postcardMode, setPostcardMode] = useState('EVENT');
  const [entriesByDate, setEntriesByDate] = useState({});
  const [momentsByDate, setMomentsByDate] = useState({});
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [activeMomentId, setActiveMomentId] = useState(null);
  const [entryDraft, setEntryDraft] = useState({ type: EVENT_TYPES[0], time: '', detail: '', description: '' });
  const [momentDraft, setMomentDraft] = useState({ type: STANDOUT_TYPES[0], time: '', description: '', detail: '', mediaRef: '' });

  const monthIndex = viewDate.getMonth(); const year = viewDate.getFullYear();
  const monthGrid = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const selectedDateKey = toDateKey(year, monthIndex, selectedDay);

  useEffect(() => {
    (async () => {
      const mod = await import('../../src/services/rememberMeService');
      const result = await mod.fetchRememberMeEntriesSafe();
      const grouped = (result.rows || []).reduce((acc, row) => {
        const key = row.date_key; if (!key) return acc;
        acc[key] = [...(acc[key] || []), { id: row.id, type: row.entry_type, time: row.time_value || '', detail: row.detail || '', description: row.description || '' }];
        return acc;
      }, {});
      setEntriesByDate(grouped);
      try { const saved = JSON.parse(localStorage.getItem(MOMENTS_STORAGE_KEY) || '{}'); setMomentsByDate(saved && typeof saved === 'object' ? saved : {}); } catch { setMomentsByDate({}); }
    })();
  }, []);

  useEffect(() => { localStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(momentsByDate)); }, [momentsByDate]);

  const closePostcard = () => { setPostcardOpen(false); setActiveEntryId(null); setActiveMomentId(null); };
  const saveEntry = async () => {
    const payload = { ...entryDraft, id: activeEntryId || crypto.randomUUID(), date_key: selectedDateKey };
    setEntriesByDate((c) => ({ ...c, [selectedDateKey]: activeEntryId ? (c[selectedDateKey] ?? []).map((e) => e.id === activeEntryId ? payload : e) : [...(c[selectedDateKey] ?? []), payload] }));
    const mod = await import('../../src/services/rememberMeService');
    await mod.upsertRememberMeEntry({ id: payload.id, date_key: selectedDateKey, entry_type: payload.type, time_value: payload.time, detail: payload.detail, description: payload.description });
    closePostcard();
  };
  const deleteEntry = async () => {
    if (!activeEntryId) return;
    setEntriesByDate((c) => ({ ...c, [selectedDateKey]: (c[selectedDateKey] ?? []).filter((e) => e.id !== activeEntryId) }));
    const mod = await import('../../src/services/rememberMeService');
    await mod.deleteRememberMeEntry(activeEntryId);
    closePostcard();
  };
  const deleteMoment = () => {
    if (!activeMomentId) return;
    setMomentsByDate((c) => ({ ...c, [selectedDateKey]: (c[selectedDateKey] ?? []).filter((m) => m.id !== activeMomentId) }));
    closePostcard();
  };

  const onLibraryUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setMomentDraft((d) => ({ ...d, mediaRef: objectUrl }));
  };

  const stampStandoutMoment = () => {
    const nextMoment = {
      id: activeMomentId || crypto.randomUUID(),
      date: selectedDateKey,
      standoutType: momentDraft.type,
      type: momentDraft.type,
      time: momentDraft.time,
      location: momentDraft.detail,
      detail: momentDraft.detail,
      description: momentDraft.description,
      mediaRef: momentDraft.mediaRef,
      photoRef: momentDraft.mediaRef,
      stamped: true
    };
    setMomentsByDate((current) => ({ ...current, [selectedDateKey]: activeMomentId ? (current[selectedDateKey] ?? []).map((m) => m.id === activeMomentId ? nextMoment : m) : [...(current[selectedDateKey] ?? []), nextMoment] }));
    closePostcard();
  };

  return <section className="remember-page"><div className="remember-scene-frame"><img className="remember-bg-img" src={`/backgrounds/REMEMBER-ME/${MONTH_BACKGROUND_BY_INDEX[monthIndex]}`} alt="" aria-hidden="true" /><div className="remember-content"><div className="remember-main"><section className="remember-calendar-panel"><div className="remember-month-row"><button type="button" onClick={() => setViewDate((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}>‹</button><button type="button" onClick={() => setViewDate((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}>›</button></div><div className="remember-weekdays">{WEEKDAY_HEADERS.map((d) => <span key={d}>{d}</span>)}</div><div className="remember-grid">{monthGrid.map((cell, idx) => <button key={`${idx}-${cell.day}`} type="button" className="remember-day" onClick={() => { if (cell.inMonth) { setSelectedDay(cell.day); setPostcardOpen(true); } }}><span className="remember-day-num">{cell.day}</span></button>)}</div></section></div>{postcardOpen && <section className="remember-postcard-popout"><header><h3>{formatDisplayDate(selectedDateKey)}</h3><button type="button" onClick={closePostcard}>CLOSE</button></header><div className="remember-type-switch"><button type="button" className={postcardMode === 'EVENT' ? 'active' : ''} onClick={() => setPostcardMode('EVENT')}>EVENT</button><button type="button" className={postcardMode === 'STANDOUT' ? 'active' : ''} onClick={() => setPostcardMode('STANDOUT')}>STANDOUT</button></div>{postcardMode === 'EVENT' ? <div className="remember-form"><select value={entryDraft.type} onChange={(e) => setEntryDraft((d) => ({ ...d, type: e.target.value }))}>{EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select><input type="time" value={entryDraft.time} onChange={(e) => setEntryDraft((d) => ({ ...d, time: e.target.value }))} /><input type="text" placeholder="LOCATION" value={entryDraft.detail} onChange={(e) => setEntryDraft((d) => ({ ...d, detail: e.target.value }))} /><textarea placeholder="DESCRIPTION" value={entryDraft.description} onChange={(e) => setEntryDraft((d) => ({ ...d, description: e.target.value }))} /><div className="remember-actions"><button type="button" onClick={saveEntry}>SAVE</button><button type="button" disabled={!activeEntryId} onClick={deleteEntry}>DELETE</button><button type="button" onClick={closePostcard}>CLOSE</button></div></div> : <div className="remember-form"><select value={momentDraft.type} onChange={(e) => setMomentDraft((d) => ({ ...d, type: e.target.value }))}>{STANDOUT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select><input type="time" value={momentDraft.time} onChange={(e) => setMomentDraft((d) => ({ ...d, time: e.target.value }))} /><input type="text" placeholder="LOCATION" value={momentDraft.detail} onChange={(e) => setMomentDraft((d) => ({ ...d, detail: e.target.value }))} /><textarea placeholder="DESCRIPTION" value={momentDraft.description} onChange={(e) => setMomentDraft((d) => ({ ...d, description: e.target.value }))} /><label>UPLOAD FROM LIBRARY<input type="file" accept="image/*" onChange={onLibraryUpload} /></label>{momentDraft.mediaRef ? <div className="remember-moment-photo-preview"><img src={momentDraft.mediaRef} alt="Uploaded standout" /></div> : null}<div className="remember-screecher-preview"><div className="remember-screecher-photo">{momentDraft.mediaRef ? <img src={momentDraft.mediaRef} alt="Standout preview" /> : <div className="remember-screecher-photo-empty">ADD PHOTO</div>}</div></div><div className="remember-actions"><button type="button" onClick={stampStandoutMoment}>STAMP IT</button><button type="button" disabled={!activeMomentId} onClick={deleteMoment}>DELETE</button><button type="button" onClick={closePostcard}>CLOSE</button></div></div>}</section>}</div></div></section>;
}

export { REMEMBER_MOMENT_BACKS, formatDisplayDate };
