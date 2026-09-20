import { fetchRememberMeEntriesSafe, groupRememberMeEntriesByDate } from '../../src/services/rememberMeService';
import { fetchScheduleEntries, groupScheduleEntriesByDate } from '../../src/services/itsGettingThiccService';

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MOMENT_TYPES = new Set(['WOW', 'WTF', 'PLOT TWIST']);

export const EMPTY_REMEMBER_ME_WEEK_AHEAD = {
  source: 'REMEMBER.ME',
  weekDays: [],
  entries: [],
  sourceFound: false,
};

function toLocalDateKey(value) {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const year = value.getFullYear();
  return `${year}-${month}-${day}`;
}

export function getRememberMeWeekAheadDays(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return {
      label: WEEKDAY_LABELS[day.getDay()],
      dateKey: toLocalDateKey(day),
      dayNumber: String(day.getDate()).padStart(2, '0'),
      entries: [],
    };
  });
}

function entryColor(entry = {}) {
  const type = String(entry.type || entry.entry_type || '').toUpperCase();
  if (entry._source === 'personal-workout') return '#ad1f68';
  if (entry.schedule_kind === 'popup') return '#2b8f92';
  if (entry.schedule_kind === 'work') return '#b47726';
  if (type === 'PAYDAY' || type === 'RENT') return '#8a5d10';
  if (type.includes('WORK') || type.includes('JOB') || type === 'MEETING' || type === 'DEADLINE') return '#884a2c';
  if (type.includes('BIRTHDAY') || type.includes('ANNIVERSARY') || type === 'TREAT DAY' || type === 'HAIRCUT') return '#a83b6f';
  if (type === 'DATE' || type.includes('DICK APPOINTMENT') || type.includes('SOCIAL')) return '#91406f';
  if (type === 'HEALTH') return '#416c5a';
  if (type.includes('TRAVEL') || type.includes('PACKAGE')) return '#776415';
  if (type === 'CALL' || type === 'REMINDER') return '#53608c';
  return '#9a3d63';
}

function entryLabel(entry = {}) {
  if (entry._source === 'personal-workout') {
    return entry.workout_label || entry.detail || 'WORKOUT';
  }
  return entry.label || entry.type || entry.entry_type || entry.detail || 'APPOINTMENT';
}

function normalizeEntry(entry = {}, dateKey) {
  const startTime = String(entry.time || entry.time_value || entry.start_time || '').trim();
  const endTime = String(entry.end_time || entry.endTime || '').trim();
  const type = String(entry.type || entry.entry_type || (entry._source === 'personal-workout' ? 'WORKOUT' : 'EVENT')).trim();

  return {
    id: String(entry.id || `${dateKey}-${type}-${startTime}-${entryLabel(entry)}`),
    date: dateKey,
    dateKey,
    startTime,
    endTime,
    label: entryLabel(entry),
    type,
    person: entry.schedule_kind === 'popup'
      ? 'POP-UP'
      : entry.schedule_kind === 'work'
        ? 'WORK'
        : entry._source === 'personal-workout'
          ? 'WORKOUT'
          : type,
    color: entryColor(entry),
  };
}

export async function readRememberMeWeekAheadMirror(date = new Date()) {
  const emptyDays = getRememberMeWeekAheadDays(date);
  if (typeof window === 'undefined') {
    return { ...EMPTY_REMEMBER_ME_WEEK_AHEAD, weekDays: emptyDays };
  }

  try {
    const [rememberResult, scheduleRows] = await Promise.all([
      fetchRememberMeEntriesSafe(),
      fetchScheduleEntries(),
    ]);
    const rememberByDate = groupRememberMeEntriesByDate(rememberResult?.rows || []);
    const personalWorkouts = (Array.isArray(scheduleRows) ? scheduleRows : [])
      .filter((row) => row.entry_type === 'personal' || row.schedule_layer === 'mista_thicc');
    const workoutsByDate = groupScheduleEntriesByDate(personalWorkouts);

    const weekDays = emptyDays.map((day) => {
      const rememberEntries = (rememberByDate[day.dateKey] || [])
        .filter((entry) => !MOMENT_TYPES.has(String(entry.entry_type || entry.type || '').trim().toUpperCase()))
        .map((entry) => ({ ...entry, _source: 'remember' }));
      const workoutEntries = (workoutsByDate[day.dateKey] || []).map((entry) => ({ ...entry, type: 'PERSONAL WORKOUT', _source: 'personal-workout' }));
      const entries = [...rememberEntries, ...workoutEntries]
        .map((entry) => normalizeEntry(entry, day.dateKey))
        .sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99') || a.label.localeCompare(b.label));
      return { ...day, entries };
    });

    return {
      source: 'REMEMBER.ME',
      weekStart: emptyDays[0]?.dateKey || '',
      weekDays,
      entries: weekDays.flatMap((day) => day.entries),
      sourceFound: true,
    };
  } catch (error) {
    console.warn('THE.ASSURER REMEMBER.ME week-ahead mirror read failed', error);
    return { ...EMPTY_REMEMBER_ME_WEEK_AHEAD, weekDays: emptyDays };
  }
}
