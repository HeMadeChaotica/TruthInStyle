'use client';

import { useEffect, useMemo, useState } from 'react';
import ChaoticaMonthCalendar, { daysInMonth, safeDateKey } from '../shared/ChaoticaMonthCalendar';
import '../../styles/sections/remember-me.css';
import { normalizeUserText } from '../../lib/utils/textCasing';
import MomentFlipCard from '../remember-me/MomentFlipCard';

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

const REMEMBER_CALENDAR_PIN = {
  calendarRight: '4.8%',
  calendarBottom: '7.6%',
  calendarWidth: '38%',
  calendarMaxWidth: '625px'
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

const getMomentType = (moment) => String(moment?.type || moment?.standoutType || '').trim().toUpperCase();


const getMomentStamp = (moment) => {
  const timestamp = Date.parse(moment?.updated_at || moment?.updatedAt || moment?.created_at || moment?.createdAt || moment?.stampedAt || '');
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export default function RememberMeSection() {
  const [viewDate, setViewDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [entriesByDate, setEntriesByDate] = useState({});
  const [momentByDate, setMomentByDate] = useState({});
  const [isClientReady, setIsClientReady] = useState(false);
  const [error, setError] = useState('');
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('EVENT');
  const [entryDraft, setEntryDraft] = useState({ type: EVENT_TYPES[0], time: '', detail: '', description: '' });
  const [momentDraft, setMomentDraft] = useState({ type: STANDOUT_TYPES[0], time: '', detail: '', description: '', mediaRef: '', persistedMediaRef: '' });
  const [flippedMomentType, setFlippedMomentType] = useState('');
  const selectedDateKey = useMemo(() => safeDateKey(viewDate.getFullYear(), viewDate.getMonth(), selectedDay), [viewDate, selectedDay]);
  const currentEntries = selectedDateKey ? (entriesByDate[selectedDateKey] || []) : [];
  const currentMoments = isClientReady && selectedDateKey ? (momentByDate[selectedDateKey] || []) : [];
  const momentCards = STANDOUT_TYPES.map((type) => ({
    type,
    moment: currentMoments
      .filter((moment) => getMomentType(moment) === type)
      .sort((left, right) => getMomentStamp(right) - getMomentStamp(left))[0] || null,
  }));
  const monthIndex = viewDate.getMonth();
  const visual = REMEMBER_MONTH_VISUALS[monthIndex] || REMEMBER_MONTH_VISUALS[0];

  useEffect(() => {
    setIsClientReady(true);
    setMomentByDate(readStoredMoments());
  }, []);

  useEffect(() => {
    setFlippedMomentType('');
  }, [selectedDateKey]);

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

  const saveEntry = async () => {
    setError('');
    if (!selectedDateKey) { setError('Invalid date.'); return; }
    const id = entryDraft.id || crypto.randomUUID();
    const payload = { ...entryDraft, id, detail: normalizeUserText(entryDraft.detail), description: normalizeUserText(entryDraft.description), date_key: selectedDateKey };
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
    const existingCreatedAt = momentDraft.created_at || momentDraft.createdAt;
    const now = new Date().toISOString();
    const nextMoment = {
      ...momentDraft,
      id: momentDraft.id || crypto.randomUUID(),
      date: selectedDateKey,
      date_key: selectedDateKey,
      detail: normalizeUserText(momentDraft.detail),
      description: normalizeUserText(momentDraft.description),
      standoutType: momentDraft.type,
      type: momentDraft.type,
      stamped: true,
      stampedAt: momentDraft.stampedAt || now,
      mediaRef: durableRef,
      photoRef: durableRef,
      persistedMediaRef: durableRef,
      created_at: existingCreatedAt || now,
      createdAt: existingCreatedAt || now,
      updated_at: now,
      updatedAt: now,
    };

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
    setFlippedMomentType(nextMoment.type);
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

  return (
    <section className="remember-page">
      <div
        className="remember-scene-frame"
        style={{
          '--rm-bg-fit': visual.bgFit,
          '--rm-bg-position': visual.bgPosition,
          '--rm-calendar-right': REMEMBER_CALENDAR_PIN.calendarRight,
          '--rm-calendar-bottom': REMEMBER_CALENDAR_PIN.calendarBottom,
          '--rm-calendar-width': REMEMBER_CALENDAR_PIN.calendarWidth,
          '--rm-calendar-max-width': REMEMBER_CALENDAR_PIN.calendarMaxWidth
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
            <ChaoticaMonthCalendar
              viewDate={viewDate}
              selectedDateKey={selectedDateKey}
              entriesByDate={entriesByDate}
              onMonthChange={(next, nextDateKey) => { setViewDate(next); setSelectedDay(Number(nextDateKey?.slice(-2)) || Math.min(selectedDay, daysInMonth(next.getFullYear(), next.getMonth()))); }}
              onSelectDate={(dateKey, day) => { setSelectedDay(day); setPostcardOpen(true); }}
              getEntryLabel={(entry) => `${entry.type}${entry.time ? ` • ${entry.time}` : ''}`}
              maxEntriesPerDay={2}
            />
          </section>
          <section className="remember-standout-postcards" aria-label="REMEMBER.ME moment flip cards">
            {momentCards.map((card) => (
              <MomentFlipCard
                key={card.type}
                type={card.type}
                moment={card.moment}
                isFlipped={flippedMomentType === card.type}
                onToggle={() => setFlippedMomentType((current) => (current === card.type ? '' : card.type))}
              />
            ))}
          </section>
        </main>
        </div>
      </div>

      {postcardOpen ? <><div className="remember-popout-scrim" onClick={() => setPostcardOpen(false)} /><section className="remember-postcard-popout"><header><h3>{formatDisplayDate(selectedDateKey)}</h3><button type="button" onClick={() => setPostcardOpen(false)}>CLOSE</button></header><div className="remember-type-switch"><button type="button" className={editorMode === 'EVENT' ? 'active' : ''} onClick={() => setEditorMode('EVENT')}>EVENT</button><button type="button" className={editorMode === 'STANDOUT' ? 'active' : ''} onClick={() => setEditorMode('STANDOUT')}>STANDOUT</button></div><div className="remember-form">{editorMode === 'EVENT' ? <><div className="remember-existing-items">{currentEntries.map((entry) => <button key={entry.id} type="button" className={entryDraft.id === entry.id ? 'active' : ''} onClick={() => setEntryDraft({ ...entry })}>{entry.type} {entry.time ? `• ${entry.time}` : ''}</button>)}</div><label>EVENT TYPE<select value={entryDraft.type} onChange={(e)=>setEntryDraft((d)=>({...d,type:e.target.value}))}>{EVENT_TYPES.map((type)=><option key={type} value={type}>{type}</option>)}</select></label><label>TIME<input type="time" value={entryDraft.time} onChange={(e)=>setEntryDraft((d)=>({...d,time:e.target.value}))} /></label><label>LOCATION<input type="text" value={entryDraft.detail} onChange={(e)=>setEntryDraft((d)=>({...d,detail:normalizeUserText(e.target.value)}))} /></label><label>DESCRIPTION<textarea value={entryDraft.description} onChange={(e)=>setEntryDraft((d)=>({...d,description:normalizeUserText(e.target.value)}))} /></label><div className="remember-actions"><button type="button" onClick={saveEntry}>SAVE</button>{entryDraft.id ? <button type="button" onClick={deleteEntry}>DELETE</button> : null}<button type="button" onClick={() => setPostcardOpen(false)}>CLOSE</button></div></> : <><div className="remember-existing-items">{currentMoments.map((moment) => <button key={moment.id} type="button" className={momentDraft.id === moment.id ? 'active' : ''} onClick={() => setMomentDraft({ ...moment, mediaRef: moment.mediaRef || '', persistedMediaRef: moment.persistedMediaRef || moment.photoRef || '' })}>{moment.type || moment.standoutType} {moment.time ? `• ${moment.time}` : ''}</button>)}</div><label>WOW / WTF / PLOT TWIST<select value={momentDraft.type} onChange={(e)=>setMomentDraft((d)=>({...d,type:e.target.value}))}>{STANDOUT_TYPES.map((type)=><option key={type} value={type}>{type}</option>)}</select></label><label>TIME<input type="time" value={momentDraft.time} onChange={(e)=>setMomentDraft((d)=>({...d,time:e.target.value}))} /></label><label>LOCATION<input type="text" value={momentDraft.detail} onChange={(e)=>setMomentDraft((d)=>({...d,detail:normalizeUserText(e.target.value)}))} /></label><label>DESCRIPTION<textarea value={momentDraft.description} onChange={(e)=>setMomentDraft((d)=>({...d,description:normalizeUserText(e.target.value)}))} /></label><label>PHOTO / IMAGE<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const objectUrl = URL.createObjectURL(file); setMomentDraft((d) => ({ ...d, mediaRef: objectUrl, persistedMediaRef: '' })); setError('Image preview only. Durable upload unavailable.'); }} /></label>{momentDraft.mediaRef ? <div className="remember-moment-photo-preview"><img src={momentDraft.mediaRef} alt="preview" /></div> : null}<div className="remember-actions"><button type="button" onClick={stampMoment}>STAMP IT</button>{momentDraft.id ? <button type="button" onClick={deleteMoment}>DELETE</button> : null}<button type="button" onClick={() => setPostcardOpen(false)}>CLOSE</button></div></>}{error ? <p className="time-error">{error}</p> : null}</div></section></> : null}

    </section>
  );
}

export { REMEMBER_MOMENT_BACKS, formatDisplayDate };
