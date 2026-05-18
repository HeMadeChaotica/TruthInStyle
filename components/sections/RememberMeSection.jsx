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

const MONTH_LAYOUT_CONFIG = {
  0: { key: 'january', calendarRight: 'clamp(18px, 2.4vw, 34px)', calendarBottom: 'clamp(18px, 2.8vh, 34px)', calendarWidth: 'clamp(430px, 42vw, 690px)', calendarScale: 0.94 },
  1: { key: 'february', calendarRight: 'clamp(18px, 2.4vw, 34px)', calendarBottom: 'clamp(18px, 2.8vh, 34px)', calendarWidth: 'clamp(410px, 40vw, 650px)', calendarScale: 0.92 },
  2: { key: 'march', calendarRight: 'clamp(18px, 2.4vw, 34px)', calendarBottom: 'clamp(18px, 2.8vh, 34px)', calendarWidth: 'clamp(430px, 42vw, 690px)', calendarScale: 0.94 },
  3: { key: 'april', calendarRight: 'clamp(18px, 2.4vw, 34px)', calendarBottom: 'clamp(18px, 2.8vh, 34px)', calendarWidth: 'clamp(410px, 40vw, 650px)', calendarScale: 0.92 },
  4: { key: 'may', calendarRight: 'clamp(18px, 2.4vw, 34px)', calendarBottom: 'clamp(18px, 2.8vh, 34px)', calendarWidth: 'clamp(450px, 44vw, 720px)', calendarScale: 0.96 },
  5: { key: 'june', calendarRight: 'clamp(18px, 2.4vw, 34px)', calendarBottom: 'clamp(18px, 2.8vh, 34px)', calendarWidth: 'clamp(450px, 44vw, 720px)', calendarScale: 0.96 },
  6: { key: 'july', calendarRight: 'clamp(18px, 2.4vw, 34px)', calendarBottom: 'clamp(18px, 2.8vh, 34px)', calendarWidth: 'clamp(430px, 42vw, 690px)', calendarScale: 0.94 },
  7: { key: 'august', calendarRight: 'clamp(18px, 2.4vw, 34px)', calendarBottom: 'clamp(18px, 2.8vh, 34px)', calendarWidth: 'clamp(410px, 40vw, 650px)', calendarScale: 0.92 },
  8: { key: 'september', calendarRight: 'clamp(18px, 2.4vw, 34px)', calendarBottom: 'clamp(18px, 2.8vh, 34px)', calendarWidth: 'clamp(410px, 40vw, 650px)', calendarScale: 0.92 },
  9: { key: 'october', calendarRight: 'clamp(18px, 2.4vw, 34px)', calendarBottom: 'clamp(18px, 2.8vh, 34px)', calendarWidth: 'clamp(420px, 41vw, 670px)', calendarScale: 0.93 },
  10: { key: 'november', calendarRight: 'clamp(18px, 2.4vw, 34px)', calendarBottom: 'clamp(18px, 2.8vh, 34px)', calendarWidth: 'clamp(430px, 42vw, 690px)', calendarScale: 0.94 },
  11: { key: 'december', calendarRight: 'clamp(18px, 2.4vw, 34px)', calendarBottom: 'clamp(18px, 2.8vh, 34px)', calendarWidth: 'clamp(430px, 42vw, 690px)', calendarScale: 0.94 }
};

const EVENT_TYPES = ['SOMETHING NEW DAY', 'APPOINTMENT', 'REMINDER', 'JOB INTERVIEW', 'BIRTHDAY', 'ANNIVERSARY', 'MEETING DEADLINE', 'EVENT', 'TRAVEL', 'CALL', 'WORKOUT', 'SOCIAL', 'PERSONAL', 'HEALTH', 'FINANCE'];
const STANDOUT_TYPES = ['WOW', 'WTF', 'PLOT TWIST'];
const WEEKDAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const REMEMBER_ME_OBSERVANCES = [
  { id: 'feb-pizza', month: 1, day: 9, chip: 'PIZZA', title: 'National Pizza Day', funFact: 'Pizza became one of America\'s favorite comfort foods after Italian immigrants popularized it.', assurerReflection: 'Comfort food and comfort chaos can both be valid coping strategies.', tone: 'FUNNY' },
  { id: 'mar-steakb', month: 2, day: 14, chip: 'STEAK+B', title: 'Steak and BJ Day', funFact: 'A modern cheeky observance that spread online as a tongue-in-cheek holiday.', assurerReflection: 'Reminder: humor plus consent equals memorable fun.', tone: 'SPICY' },
  { id: 'june-pride', month: 5, day: null, allMonth: true, chip: 'PRIDE', title: 'Pride Month', funFact: 'Pride honors LGBTQ+ history and protest roots while celebrating identity and joy.', assurerReflection: 'Lead with joy, protect your people, and keep your boundaries sacred.', tone: 'PRIDE' },
  { id: 'oct-halloween', month: 9, day: 31, chip: 'HALLOWEEN', title: 'Halloween', funFact: 'Halloween evolved from ancient festivals and became a giant costume tradition.', assurerReflection: 'Costume confidence is still confidence; own the bit.', tone: 'CHAOS' }
];
const toDateKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const buildMonthGrid = (v) => { const y = v.getFullYear(); const m = v.getMonth(); const f = new Date(y, m, 1); const w = f.getDay(); const dim = new Date(y, m + 1, 0).getDate(); const dip = new Date(y, m, 0).getDate(); const cells = []; for (let i = w - 1; i >= 0; i--) cells.push({ day: dip - i, inMonth: false, dateKey: toDateKey(y, m - 1, dip - i) }); for (let d = 1; d <= dim; d++) cells.push({ day: d, inMonth: true, dateKey: toDateKey(y, m, d) }); for (let t = 1; cells.length % 7 !== 0; t++) cells.push({ day: t, inMonth: false, dateKey: toDateKey(y, m + 1, t) }); return cells; };

export default function RememberMeSection() {
  const MOMENTS_STORAGE_KEY = 'remember_me_standout_moments_v1';
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [postcardMode, setPostcardMode] = useState('EVENT');
  const [entriesByDate, setEntriesByDate] = useState({});
  const [momentsByDate, setMomentsByDate] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [entryDraft, setEntryDraft] = useState({ type: EVENT_TYPES[0], time: '', detail: '', description: '' });
  const [activeMomentId, setActiveMomentId] = useState(null);
  const [momentDraft, setMomentDraft] = useState({ type: STANDOUT_TYPES[0], time: '', description: '', detail: '', mediaRef: '' });

  const monthIndex = viewDate.getMonth(); const year = viewDate.getFullYear(); const monthName = viewDate.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const monthLayout = MONTH_LAYOUT_CONFIG[monthIndex] || MONTH_LAYOUT_CONFIG[0];
    const monthGrid = useMemo(() => buildMonthGrid(viewDate), [viewDate]); const selectedDateKey = toDateKey(year, monthIndex, selectedDay);
  const today = new Date(); const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const monthObservances = useMemo(() => REMEMBER_ME_OBSERVANCES.filter((o) => o.month === monthIndex), [monthIndex]);
  const monthSticky = monthObservances.filter((o) => o.allMonth);
  const selectedObservances = monthObservances.filter((o) => o.allMonth || o.day === selectedDay);
  const selectedMoments = momentsByDate[selectedDateKey] ?? [];
  const standoutPostcards = useMemo(() => Object.entries(momentsByDate).flatMap(([date, moments]) => moments.map((moment) => ({ date, moment }))).filter(({ date, moment }) => date.startsWith(`${year}-${String(monthIndex + 1).padStart(2, '0')}`) && moment.stamped).slice(0, 6), [momentsByDate, year, monthIndex]);

  useEffect(() => { (async () => { const mod = await import('../../src/services/rememberMeService'); const result = await mod.fetchRememberMeEntriesSafe(); const grouped = (result.rows || []).reduce((acc, row) => { const key = row.date_key; if (!key) return acc; acc[key] = [...(acc[key] || []), { id: row.id, type: row.entry_type, time: row.time_value || '', detail: row.detail || '', description: row.description || '' }]; return acc; }, {}); setEntriesByDate(grouped); if (typeof window !== 'undefined') { try { const saved = JSON.parse(localStorage.getItem(MOMENTS_STORAGE_KEY) || '{}'); setMomentsByDate(saved && typeof saved === 'object' ? saved : {}); } catch { setMomentsByDate({}); } } if (result.error && (!result.rows || result.rows.length === 0)) { console.warn('[REMEMBER.ME LOAD]', result.error); setErrorMessage(result.error); } else if (result.error) { console.warn('[REMEMBER.ME LOAD FALLBACK]', result.error); setErrorMessage(''); } })(); }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(momentsByDate));
  }, [momentsByDate]);

  const openDayPostcard = (day) => { setSelectedDay(day); setPostcardOpen(true); };
  const closePostcard = () => { setPostcardOpen(false); setActiveEntryId(null); setActiveMomentId(null); setErrorMessage(''); };
  const resetEntryDraft = () => { setEntryDraft({ type: EVENT_TYPES[0], time: '', detail: '', description: '' }); setActiveEntryId(null); };
  const resetMomentDraft = () => { setMomentDraft({ type: STANDOUT_TYPES[0], time: '', description: '', detail: '', mediaRef: '' }); setActiveMomentId(null); };
  const saveEntry = async () => { const payload = { ...entryDraft, id: activeEntryId || crypto.randomUUID(), date_key: selectedDateKey }; setEntriesByDate((c) => ({ ...c, [selectedDateKey]: activeEntryId ? (c[selectedDateKey] ?? []).map((e) => e.id === activeEntryId ? { ...payload } : e) : [...(c[selectedDateKey] ?? []), payload] })); try { const mod = await import('../../src/services/rememberMeService'); const saved = await mod.upsertRememberMeEntry({ id: payload.id, date_key: selectedDateKey, entry_type: payload.type, time_value: payload.time, detail: payload.detail, description: payload.description }); setEntriesByDate((c) => ({ ...c, [selectedDateKey]: (c[selectedDateKey] ?? []).map((e) => e.id === payload.id ? { ...e, id: saved.id } : e) })); resetEntryDraft(); closePostcard(); } catch (error) { setErrorMessage(error?.message || 'Unable to save entry.'); } };
  const deleteEntry = async (id) => { setEntriesByDate((c) => ({ ...c, [selectedDateKey]: (c[selectedDateKey] ?? []).filter((e) => e.id !== id) })); try { const mod = await import('../../src/services/rememberMeService'); await mod.deleteRememberMeEntry(id); resetEntryDraft(); closePostcard(); } catch (error) { setErrorMessage(error?.message || 'Unable to delete entry.'); } };
  const deleteMoment = (id) => { setMomentsByDate((c) => ({ ...c, [selectedDateKey]: (c[selectedDateKey] ?? []).filter((m) => m.id !== id) })); closePostcard(); resetMomentDraft(); };
  const upsertStandoutMoment = async ({ stamped = false } = {}) => {
    const selectedKey = selectedDateKey;
    const existingMoments = momentsByDate[selectedKey] || [];
    const existing = activeMomentId ? existingMoments.find((moment) => moment.id === activeMomentId) : null;
    if (!activeMomentId && existingMoments.length >= 3) {
      setErrorMessage('MAX 3 STANDOUTS PER DAY.');
      return null;
    }
    const nextMoment = {
      id: activeMomentId || crypto.randomUUID(),
      date: selectedKey,
      mode: 'STANDOUT',
      standoutType: momentDraft.standoutType || momentDraft.type || 'WOW',
      type: momentDraft.standoutType || momentDraft.type || 'WOW',
      time: momentDraft.time || '',
      location: momentDraft.location || momentDraft.detail || '',
      detail: momentDraft.location || momentDraft.detail || '',
      description: momentDraft.description || '',
      photoRef: momentDraft.photoRef || momentDraft.mediaRef || '',
      mediaRef: momentDraft.photoRef || momentDraft.mediaRef || '',
      stamped,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setMomentsByDate((current) => ({
      ...current,
      [selectedKey]: activeMomentId
        ? (current[selectedKey] ?? []).map((moment) => moment.id === activeMomentId ? nextMoment : moment)
        : [...(current[selectedKey] ?? []), nextMoment]
    }));
    setErrorMessage('');
    return nextMoment;
  };
  const stampStandoutMoment = async () => { const saved = await upsertStandoutMoment({ stamped: true }); if (!saved) return; closePostcard(); resetMomentDraft(); };

  return <section className="remember-page" style={{ '--remember-bg-image': `url('/background/REMEMBER-ME/${MONTH_BACKGROUND_BY_INDEX[monthIndex]}')`, '--rm-calendar-right': monthLayout.calendarRight, '--rm-calendar-bottom': monthLayout.calendarBottom, '--rm-calendar-width': monthLayout.calendarWidth, '--rm-calendar-scale': monthLayout.calendarScale }}><div className="remember-overlay" aria-hidden="true" /><div className="remember-content"><header className="remember-head"><h1 className="remember-sr-only">REMEMBER.ME</h1></header><main className="remember-main"><section className="remember-calendar-panel" aria-label="Month calendar"><div className="remember-month-row"><button type="button" onClick={() => { setViewDate((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1)); setSelectedDay(1); }}>‹</button><h2 className="remember-sr-only">{monthName} {year}</h2><span className="remember-month-mini">{monthName} {year}</span><button type="button" onClick={() => { setViewDate((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1)); setSelectedDay(1); }}>›</button></div>{monthSticky.length > 0 && <div className="remember-month-sticky">{monthSticky.map((o) => <span key={o.id} className="remember-chip remember-chip-observance">{o.chip}</span>)}</div>}<div className="remember-weekdays">{WEEKDAY_HEADERS.map((d) => <span key={d}>{d}</span>)}</div><div className="remember-grid">{monthGrid.map((cell, idx) => { const entries = entriesByDate[cell.dateKey] ?? []; const moments = momentsByDate[cell.dateKey] ?? []; const [_, m, d] = cell.dateKey.split('-').map(Number); const singleDayObs = REMEMBER_ME_OBSERVANCES.filter((o) => o.month === m - 1 && !o.allMonth && o.day === d); const chips = [...singleDayObs.map((o) => ({ tone: 'observance', label: o.chip })), ...entries.map((e) => ({ tone: 'entry', label: e.type.replace('MEETING DEADLINE', 'DEADLINE') })), ...moments.map((me) => ({ tone: 'moment', label: me.type }))]; return <button key={`${idx}-${cell.day}`} type="button" className={`remember-day ${cell.inMonth ? '' : 'remember-outside'} ${cell.inMonth && selectedDay === cell.day ? 'remember-selected' : ''} ${cell.dateKey === todayKey ? 'remember-today' : ''}`.trim()} onClick={() => cell.inMonth && openDayPostcard(cell.day)} disabled={!cell.inMonth}><span className="remember-day-num">{cell.day}</span><span className="remember-day-chips">{chips.slice(0, 3).map((chip, i) => <span key={`${chip.label}-${i}`} className={`remember-chip remember-chip-${chip.tone}`}>{chip.label}</span>)}</span></button>; })}</div></section>{standoutPostcards.length > 0 && <section className="remember-postcards-panel"><h3>STANDOUT POSTCARDS</h3>{standoutPostcards.map(({ date, moment }) => <article key={moment.id} className="remember-postcard"><span>{date}</span><strong>{moment.type}</strong><p>{moment.description || 'STAMPED MEMORY'}</p>{moment.mediaRef && <small>{moment.mediaRef}</small>}{moment.stamped && <em>STAMPED</em>}</article>)}</section>}</main>{postcardOpen && <section className="remember-postcard-popout" aria-label="Day postcard editor">{errorMessage ? <p className="remember-load-alert">{errorMessage}</p> : null}<header><h3>{selectedDateKey}</h3><button type="button" onClick={closePostcard}>CLOSE</button></header><div className="remember-type-switch"><button type="button" className={postcardMode === 'EVENT' ? 'active' : ''} onClick={() => setPostcardMode('EVENT')}>EVENT</button><button type="button" className={postcardMode === 'STANDOUT' ? 'active' : ''} onClick={() => setPostcardMode('STANDOUT')}>STANDOUT</button></div>{selectedObservances.length > 0 && <div className="remember-observance-note">{selectedObservances.map((o) => <article key={o.id}><strong>{o.title}</strong><p>{o.funFact}</p><p>{o.assurerReflection}</p></article>)}</div>}{postcardMode === 'EVENT' ? <div className="remember-form"><select value={entryDraft.type} onChange={(e) => setEntryDraft((d) => ({ ...d, type: e.target.value }))}>{EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select><input type="text" value={selectedDateKey} readOnly /><input type="time" value={entryDraft.time} onChange={(e) => setEntryDraft((d) => ({ ...d, time: e.target.value }))} /><input type="text" placeholder="location" value={entryDraft.detail} onChange={(e) => setEntryDraft((d) => ({ ...d, detail: e.target.value }))} /><textarea placeholder="description" value={entryDraft.description} onChange={(e) => setEntryDraft((d) => ({ ...d, description: e.target.value }))} /><div className="remember-actions"><button type="button" onClick={saveEntry}>SAVE</button>{activeEntryId ? <button type="button" onClick={() => deleteEntry(activeEntryId)}>DELETE</button> : null}<button type="button" onClick={closePostcard}>CLOSE</button></div></div> : <div className="remember-form"><select value={momentDraft.type} onChange={(e) => setMomentDraft((d) => ({ ...d, type: e.target.value }))}>{STANDOUT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select><input type="text" value={selectedDateKey} readOnly /><input type="time" value={momentDraft.time} onChange={(e) => setMomentDraft((d) => ({ ...d, time: e.target.value }))} /><input type="text" placeholder="location" value={momentDraft.detail} onChange={(e) => setMomentDraft((d) => ({ ...d, detail: e.target.value }))} /><textarea placeholder="description" value={momentDraft.description} onChange={(e) => setMomentDraft((d) => ({ ...d, description: e.target.value }))} /><input type="text" placeholder="photo" value={momentDraft.mediaRef} onChange={(e) => setMomentDraft((d) => ({ ...d, mediaRef: e.target.value }))} /><div className="remember-actions"><button type="button" onClick={stampStandoutMoment}>STAMP IT</button>{activeMomentId ? <button type="button" onClick={() => deleteMoment(activeMomentId)}>DELETE</button> : null}<button type="button" onClick={closePostcard}>CLOSE</button></div></div>}</section>}</div></section>;
}
