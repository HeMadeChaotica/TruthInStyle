'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ChaoticaMonthCalendar, { daysInMonth, safeDateKey } from '../shared/ChaoticaMonthCalendar';
import '../../styles/sections/remember-me.css';
import { normalizeUserText } from '../../lib/utils/textCasing';
import MomentFlipCard from '../remember-me/MomentFlipCard';
import { uploadPrivateImage } from '../../src/services/mediaUploadService';
import { CLOCK_IT_KEYS, useClockItOptions } from '../../lib/dropdowns/clockItRegistry';

const REMEMBER_MOMENT_BACKS = { WOW: '', WTF: '', 'PLOT TWIST': '' };
const MOMENTS_STORAGE_KEY = 'remember_me_standout_moments_v1';
const WEEKDAYS = [
  ['sun', 'SUN'], ['mon', 'MON'], ['tue', 'TUE'], ['wed', 'WED'],
  ['thu', 'THU'], ['fri', 'FRI'], ['sat', 'SAT'],
];

const SEASON_BY_MONTH = {
  0: { key: 'winter', calendarSide: 'right' },
  1: { key: 'winter', calendarSide: 'right' },
  2: { key: 'spring', calendarSide: 'left' },
  3: { key: 'spring', calendarSide: 'left' },
  4: { key: 'spring', calendarSide: 'left' },
  5: { key: 'summer', calendarSide: 'right' },
  6: { key: 'summer', calendarSide: 'right' },
  7: { key: 'summer', calendarSide: 'right' },
  8: { key: 'fall', calendarSide: 'left' },
  9: { key: 'fall', calendarSide: 'left' },
  10: { key: 'fall', calendarSide: 'left' },
  11: { key: 'winter', calendarSide: 'right' },
};

const BACKGROUND_BY_SEASON = {
  fall: 'remember-me-season-fall-crystallization.png',
  spring: 'remember-me-season-spring-crystallization.png',
  summer: 'remember-me-season-summer-crystallization.png',
  winter: 'remember-me-season-winter-crystallization.png',
};

const EMPTY_EVENT = { type: 'SOMETHING NEW DAY', time: '', detail: '', description: '', recurrence_type: 'none', recurrence_days: [], recurrence_active: false };
const EMPTY_WORKOUT = { start_time: '', end_time: '', workout_label: '', location: '', notes: '', recurrence_type: 'none', recurrence_days: [], recurrence_active: false };
const EMPTY_MOMENT = { type: 'WOW', time: '', detail: '', description: '', mediaRef: '', persistedMediaRef: '' };

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
  const [year, month, day] = String(value).split('-');
  return year && month && day ? `${month}/${day}/${year}` : '';
};

const getMomentType = (moment) => String(moment?.type || moment?.standoutType || '').trim().toUpperCase();
const getMomentStamp = (moment) => {
  const stamp = Date.parse(moment?.updated_at || moment?.updatedAt || moment?.created_at || moment?.createdAt || moment?.stampedAt || '');
  return Number.isNaN(stamp) ? 0 : stamp;
};

const weekdayForDateKey = (dateKey) => {
  const candidate = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(candidate.getTime()) ? 'mon' : WEEKDAYS[candidate.getDay()][0];
};

function RecurrenceControl({ draft, setDraft, selectedDateKey }) {
  return (
    <fieldset className="remember-recurrence">
      <legend>REPEAT</legend>
      <select
        value={draft.recurrence_type || 'none'}
        onChange={(event) => {
          const weekly = event.target.value === 'weekly';
          setDraft((current) => ({
            ...current,
            recurrence_type: weekly ? 'weekly' : 'none',
            recurrence_active: weekly,
            recurrence_days: weekly && !current.recurrence_days?.length
              ? [weekdayForDateKey(selectedDateKey)]
              : (current.recurrence_days || []),
          }));
        }}
      >
        <option value="none">DOES NOT REPEAT</option>
        <option value="weekly">REPEATS WEEKLY</option>
      </select>
      {draft.recurrence_type === 'weekly' ? (
        <div className="remember-weekday-picker">
          {WEEKDAYS.map(([value, label]) => (
            <label key={value}>
              <input
                type="checkbox"
                checked={(draft.recurrence_days || []).includes(value)}
                onChange={() => setDraft((current) => ({
                  ...current,
                  recurrence_days: (current.recurrence_days || []).includes(value)
                    ? current.recurrence_days.filter((day) => day !== value)
                    : [...(current.recurrence_days || []), value],
                }))}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      ) : null}
    </fieldset>
  );
}

const colorForEntry = (entry) => {
  if (entry?._source === 'personal-workout') return 'linear-gradient(135deg,#ff4fa8,#a6246d)';
  const type = String(entry?.type || entry?.entry_type || '').toUpperCase();
  if (type === 'PAYDAY') return 'linear-gradient(135deg,#f6d36a,#ad7428)';
  if (type.includes('WORK') || type.includes('JOB') || type === 'MEETING') return 'linear-gradient(135deg,#d99866,#7e472c)';
  if (type.includes('BIRTHDAY') || type.includes('ANNIVERSARY') || type === 'DATE') return 'linear-gradient(135deg,#ff9fc9,#b43779)';
  if (type.includes('TRAVEL')) return 'linear-gradient(135deg,#e7d65a,#9b792b)';
  return 'linear-gradient(135deg,#e68caf,#8f3f62)';
};

export default function RememberMeSection() {
  const configuredEventTypes = useClockItOptions(CLOCK_IT_KEYS.rememberEventTypes);
  const configuredStandoutTypes = useClockItOptions(CLOCK_IT_KEYS.rememberMomentTypes);
  const eventTypes = [...new Set([...(configuredEventTypes.length ? configuredEventTypes : ['SOMETHING NEW DAY', 'REMINDER']), 'PAYDAY'])];
  const standoutTypes = configuredStandoutTypes.length ? configuredStandoutTypes : ['WOW', 'WTF', 'PLOT TWIST'];
  const [viewDate, setViewDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [rememberRows, setRememberRows] = useState([]);
  const [workoutRows, setWorkoutRows] = useState([]);
  const [entriesByDate, setEntriesByDate] = useState({});
  const [momentByDate, setMomentByDate] = useState({});
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('EVENT');
  const [entryDraft, setEntryDraft] = useState(EMPTY_EVENT);
  const [workoutDraft, setWorkoutDraft] = useState(EMPTY_WORKOUT);
  const [momentDraft, setMomentDraft] = useState(EMPTY_MOMENT);
  const [flippedMomentType, setFlippedMomentType] = useState('');
  const [error, setError] = useState('');

  const selectedDateKey = useMemo(
    () => safeDateKey(viewDate.getFullYear(), viewDate.getMonth(), selectedDay),
    [viewDate, selectedDay],
  );
  const currentMoments = selectedDateKey ? (momentByDate[selectedDateKey] || []) : [];
  const season = SEASON_BY_MONTH[viewDate.getMonth()] || SEASON_BY_MONTH[0];
  const backgroundName = BACKGROUND_BY_SEASON[season.key];
  const momentCards = standoutTypes.map((type) => ({
    type,
    moment: currentMoments
      .filter((moment) => getMomentType(moment) === type)
      .sort((left, right) => getMomentStamp(right) - getMomentStamp(left))[0] || null,
  }));

  const loadUnifiedEntries = useCallback(async () => {
    try {
      const [rememberService, scheduleService] = await Promise.all([
        import('../../src/services/rememberMeService'),
        import('../../src/services/itsGettingThiccService'),
      ]);
      const [rememberResult, scheduleResult] = await Promise.all([
        rememberService.fetchRememberMeEntriesSafe(),
        scheduleService.fetchScheduleEntries(),
      ]);
      const nextRememberRows = rememberResult.rows || [];
      const nextWorkoutRows = (scheduleResult || []).filter((row) => row.entry_type === 'personal' || row.schedule_layer === 'mista_thicc');
      const groupedRemember = rememberService.groupRememberMeEntriesByDate(nextRememberRows);
      const groupedWorkouts = scheduleService.groupScheduleEntriesByDate(nextWorkoutRows);
      const dateKeys = new Set([...Object.keys(groupedRemember), ...Object.keys(groupedWorkouts)]);
      const merged = {};
      dateKeys.forEach((dateKey) => {
        const events = (groupedRemember[dateKey] || []).map((row) => ({ ...row, _source: 'remember' }));
        const workouts = (groupedWorkouts[dateKey] || []).map((row) => ({ ...row, type: 'PERSONAL WORKOUT', time: row.start_time, detail: row.workout_label, _source: 'personal-workout' }));
        merged[dateKey] = [...events, ...workouts].sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
      });
      setRememberRows(nextRememberRows);
      setWorkoutRows(nextWorkoutRows);
      setEntriesByDate(merged);
      if (rememberResult.error) setError(rememberResult.error);
    } catch (loadError) {
      console.error('REMEMBER.ME unified calendar load failed', loadError);
      setError('The unified calendar could not load.');
    }
  }, []);

  useEffect(() => {
    setMomentByDate(readStoredMoments());
    loadUnifiedEntries();
  }, [loadUnifiedEntries]);

  useEffect(() => setFlippedMomentType(''), [selectedDateKey]);

  const openNew = (dateKey, day) => {
    setSelectedDay(day);
    setEntryDraft({ ...EMPTY_EVENT, type: eventTypes[0] || EMPTY_EVENT.type });
    setWorkoutDraft(EMPTY_WORKOUT);
    setMomentDraft({ ...EMPTY_MOMENT, type: standoutTypes[0] || EMPTY_MOMENT.type });
    setEditorMode('EVENT');
    setError('');
    setPostcardOpen(Boolean(dateKey));
  };

  const editCalendarEntry = (entry, dateKey) => {
    setSelectedDay(Number(dateKey?.slice(-2)) || selectedDay);
    setError('');
    if (entry._source === 'personal-workout') {
      const originalId = entry.original_entry_id || entry.id;
      const original = workoutRows.find((row) => row.id === originalId) || entry;
      setWorkoutDraft({ ...EMPTY_WORKOUT, ...original });
      setEditorMode('WORKOUT');
    } else {
      const originalId = entry.original_entry_id || entry.id;
      const original = rememberRows.find((row) => row.id === originalId) || entry;
      setEntryDraft({
        ...EMPTY_EVENT,
        ...original,
        type: original.type || original.entry_type,
        time: original.time || original.time_value,
      });
      setEditorMode('EVENT');
    }
    setPostcardOpen(true);
  };

  const saveEvent = async () => {
    if (!selectedDateKey) return setError('Select a valid date.');
    setError('Saving event...');
    try {
      const service = await import('../../src/services/rememberMeService');
      await service.upsertRememberMeEntry({
        id: entryDraft.id,
        date_key: entryDraft.date_key || selectedDateKey,
        entry_type: entryDraft.type,
        time_value: entryDraft.time,
        detail: normalizeUserText(entryDraft.detail),
        description: normalizeUserText(entryDraft.description),
        recurrence_type: entryDraft.recurrence_type || 'none',
        recurrence_days: entryDraft.recurrence_days || [],
        recurrence_active: Boolean(entryDraft.recurrence_active),
      });
      await loadUnifiedEntries();
      setPostcardOpen(false);
    } catch (saveError) {
      setError(saveError?.message || 'Event save failed.');
    }
  };

  const saveWorkout = async () => {
    if (!selectedDateKey) return setError('Select a valid date.');
    setError('Saving personal workout...');
    try {
      const service = await import('../../src/services/itsGettingThiccService');
      await service.saveScheduleEntry({
        ...workoutDraft,
        entry_type: 'personal',
        schedule_layer: 'mista_thicc',
        client_id: null,
        client_name: '',
        entry_date: workoutDraft.entry_date || selectedDateKey,
        color_option_key: 'mista-thicc-pink',
        workout_label: normalizeUserText(workoutDraft.workout_label),
        location: normalizeUserText(workoutDraft.location),
        notes: normalizeUserText(workoutDraft.notes),
        recurrence_type: workoutDraft.recurrence_type || 'none',
        recurrence_days: workoutDraft.recurrence_days || [],
        recurrence_active: Boolean(workoutDraft.recurrence_active),
      });
      await loadUnifiedEntries();
      setPostcardOpen(false);
    } catch (saveError) {
      setError(saveError?.message || 'Workout save failed.');
    }
  };

  const deleteActive = async () => {
    try {
      if (editorMode === 'EVENT' && entryDraft.id) {
        const service = await import('../../src/services/rememberMeService');
        await service.deleteRememberMeEntry(entryDraft.id);
      } else if (editorMode === 'WORKOUT' && workoutDraft.id) {
        const service = await import('../../src/services/itsGettingThiccService');
        await service.deleteScheduleEntry(workoutDraft.id);
      } else return;
      await loadUnifiedEntries();
      setPostcardOpen(false);
    } catch (deleteError) {
      setError(deleteError?.message || 'Delete failed.');
    }
  };

  const stampMoment = () => {
    if (!selectedDateKey) return setError('Select a valid date.');
    const stored = readStoredMoments();
    const dayList = Array.isArray(stored[selectedDateKey]) ? stored[selectedDateKey] : [];
    if (!momentDraft.id && dayList.length >= 3) return setError('Max 3 standouts per day.');
    const now = new Date().toISOString();
    const durableRef = momentDraft.persistedMediaRef && !momentDraft.persistedMediaRef.startsWith('blob:') ? momentDraft.persistedMediaRef : '';
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
      created_at: momentDraft.created_at || now,
      updated_at: now,
    };
    const nextDayList = momentDraft.id ? dayList.map((moment) => moment.id === momentDraft.id ? nextMoment : moment) : [...dayList, nextMoment];
    const nextState = { ...stored, [selectedDateKey]: nextDayList };
    localStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(nextState));
    setMomentByDate(nextState);
    setFlippedMomentType(nextMoment.type);
    setPostcardOpen(false);
  };

  const deleteMoment = () => {
    if (!selectedDateKey || !momentDraft.id) return;
    const stored = readStoredMoments();
    const nextState = { ...stored, [selectedDateKey]: (stored[selectedDateKey] || []).filter((moment) => moment.id !== momentDraft.id) };
    localStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(nextState));
    setMomentByDate(nextState);
    setPostcardOpen(false);
  };

  const uploadMomentImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setMomentDraft((draft) => ({ ...draft, mediaRef: objectUrl, persistedMediaRef: '' }));
    setError('Uploading image...');
    try {
      const uploaded = await uploadPrivateImage(file, { context: 'remember-me', sourceDate: selectedDateKey });
      setMomentDraft((draft) => ({ ...draft, mediaRef: uploaded.url, persistedMediaRef: uploaded.url, mediaId: uploaded.id, mediaPath: uploaded.path }));
      setError('Image secured in the private media library.');
    } catch (uploadError) {
      setError(uploadError?.message || 'Image upload failed.');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <section className={`remember-page remember-season-${season.key}`}>
      <div className="remember-scene-frame">
        <img className="remember-bg-img" src={`/backgrounds/REMEMBER-ME/${backgroundName}`} alt="" aria-hidden="true" />
        <div className="remember-overlay" aria-hidden="true" />
        <main className={`remember-main remember-calendar-${season.calendarSide}`}>
          <section className="remember-calendar-panel" aria-label="Unified REMEMBER.ME calendar">
            <ChaoticaMonthCalendar
              viewDate={viewDate}
              selectedDateKey={selectedDateKey}
              entriesByDate={entriesByDate}
              onMonthChange={(next, nextDateKey) => {
                setViewDate(next);
                setSelectedDay(Number(nextDateKey?.slice(-2)) || Math.min(selectedDay, daysInMonth(next.getFullYear(), next.getMonth())));
              }}
              onSelectDate={openNew}
              onEntryClick={editCalendarEntry}
              getEntryLabel={(entry) => entry._source === 'personal-workout'
                ? `WORKOUT${entry.time ? ` • ${entry.time}` : ''}`
                : `${entry.type || entry.entry_type}${entry.time ? ` • ${entry.time}` : ''}`}
              getEntryColor={colorForEntry}
              getEntryTextColor={() => '#fff7f0'}
              maxEntriesPerDay={3}
            />
          </section>
          <section className="remember-standout-postcards" aria-label="REMEMBER.ME moment flip cards">
            {momentCards.map((card) => (
              <MomentFlipCard
                key={card.type}
                type={card.type}
                moment={card.moment}
                isFlipped={flippedMomentType === card.type}
                onToggle={() => setFlippedMomentType((current) => current === card.type ? '' : card.type)}
              />
            ))}
          </section>
        </main>
      </div>

      {postcardOpen ? (
        <>
          <div className="remember-popout-scrim" onClick={() => setPostcardOpen(false)} />
          <section className="remember-postcard-popout">
            <header><h3>{formatDisplayDate(selectedDateKey)}</h3><button type="button" onClick={() => setPostcardOpen(false)}>CLOSE</button></header>
            <div className="remember-type-switch">
              {['EVENT', 'WORKOUT', 'STANDOUT'].map((mode) => <button key={mode} type="button" className={editorMode === mode ? 'active' : ''} onClick={() => setEditorMode(mode)}>{mode}</button>)}
            </div>
            <div className="remember-form">
              {editorMode === 'EVENT' ? (
                <>
                  <label>EVENT TYPE<select value={entryDraft.type} onChange={(event) => setEntryDraft((draft) => ({ ...draft, type: event.target.value }))}>{eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
                  <label>TIME<input type="time" value={entryDraft.time || ''} onChange={(event) => setEntryDraft((draft) => ({ ...draft, time: event.target.value }))} /></label>
                  <label>LOCATION<input value={entryDraft.detail || ''} onChange={(event) => setEntryDraft((draft) => ({ ...draft, detail: event.target.value }))} /></label>
                  <label>DESCRIPTION<textarea value={entryDraft.description || ''} onChange={(event) => setEntryDraft((draft) => ({ ...draft, description: event.target.value }))} /></label>
                  <RecurrenceControl draft={entryDraft} setDraft={setEntryDraft} selectedDateKey={selectedDateKey} />
                  <div className="remember-actions"><button type="button" onClick={saveEvent}>SAVE EVENT</button>{entryDraft.id ? <button type="button" onClick={deleteActive}>DELETE</button> : null}</div>
                </>
              ) : null}
              {editorMode === 'WORKOUT' ? (
                <>
                  <label>WORKOUT / SESSION<input value={workoutDraft.workout_label || ''} onChange={(event) => setWorkoutDraft((draft) => ({ ...draft, workout_label: event.target.value }))} /></label>
                  <div className="remember-time-pair"><label>START<input type="time" value={workoutDraft.start_time || ''} onChange={(event) => setWorkoutDraft((draft) => ({ ...draft, start_time: event.target.value }))} /></label><label>END<input type="time" value={workoutDraft.end_time || ''} onChange={(event) => setWorkoutDraft((draft) => ({ ...draft, end_time: event.target.value }))} /></label></div>
                  <label>LOCATION<input value={workoutDraft.location || ''} onChange={(event) => setWorkoutDraft((draft) => ({ ...draft, location: event.target.value }))} /></label>
                  <label>NOTES<textarea value={workoutDraft.notes || ''} onChange={(event) => setWorkoutDraft((draft) => ({ ...draft, notes: event.target.value }))} /></label>
                  <RecurrenceControl draft={workoutDraft} setDraft={setWorkoutDraft} selectedDateKey={selectedDateKey} />
                  <div className="remember-actions"><button type="button" onClick={saveWorkout}>SAVE WORKOUT</button>{workoutDraft.id ? <button type="button" onClick={deleteActive}>DELETE</button> : null}</div>
                </>
              ) : null}
              {editorMode === 'STANDOUT' ? (
                <>
                  <div className="remember-existing-items">{currentMoments.map((moment) => <button key={moment.id} type="button" className={momentDraft.id === moment.id ? 'active' : ''} onClick={() => setMomentDraft({ ...EMPTY_MOMENT, ...moment, type: moment.type || moment.standoutType, mediaRef: moment.mediaRef || '', persistedMediaRef: moment.persistedMediaRef || moment.photoRef || '' })}>{moment.type || moment.standoutType}</button>)}</div>
                  <label>WOW / WTF / PLOT TWIST<select value={momentDraft.type} onChange={(event) => setMomentDraft((draft) => ({ ...draft, type: event.target.value }))}>{standoutTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
                  <label>TIME<input type="time" value={momentDraft.time || ''} onChange={(event) => setMomentDraft((draft) => ({ ...draft, time: event.target.value }))} /></label>
                  <label>LOCATION<input value={momentDraft.detail || ''} onChange={(event) => setMomentDraft((draft) => ({ ...draft, detail: event.target.value }))} /></label>
                  <label>DESCRIPTION<textarea value={momentDraft.description || ''} onChange={(event) => setMomentDraft((draft) => ({ ...draft, description: event.target.value }))} /></label>
                  <label>PHOTO / IMAGE<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadMomentImage} /></label>
                  {momentDraft.mediaRef ? <div className="remember-moment-photo-preview"><img src={momentDraft.mediaRef} alt="Selected standout" /></div> : null}
                  <div className="remember-actions"><button type="button" onClick={stampMoment}>STAMP IT</button>{momentDraft.id ? <button type="button" onClick={deleteMoment}>DELETE</button> : null}</div>
                </>
              ) : null}
              {error ? <p className="time-error">{error}</p> : null}
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}

export { REMEMBER_MOMENT_BACKS, formatDisplayDate };
