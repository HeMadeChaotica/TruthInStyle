import {
  buildThiccTimeAssurerPayload,
  fetchScheduleEntries,
  groupScheduleEntriesByDate,
  resolveClientColor,
} from '../../src/services/itsGettingThiccService';

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const EMPTY_THICC_TIME_WEEK_MIRROR = {
  source: 'THICC.TIME',
  weekDays: [],
  entries: [],
  sourceFound: false,
};

function toLocalIsoDate(value) {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const year = value.getFullYear();

  return `${year}-${month}-${day}`;
}

export function getThiccTimeWeekStart(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function getThiccTimeWeekDays(date = new Date()) {
  const start = getThiccTimeWeekStart(date);

  return WEEKDAY_LABELS.map((label, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return {
      label,
      dateKey: toLocalIsoDate(day),
      dayNumber: String(day.getDate()).padStart(2, '0'),
      entries: [],
    };
  });
}

function displayName(entry = {}) {
  return entry.clientName || entry.prospectName || (entry.scheduleLayer === 'mista_thicc' ? 'MISTA.THICC' : 'THICC.TIME');
}

function displayLabel(entry = {}) {
  return entry.title || entry.entryType || entry.scheduleLayer || 'SCHEDULE';
}

function normalizeWeekEntry(entry = {}) {
  const color = resolveClientColor(entry.colorOptionKey || 'cobalt');

  return {
    ...entry,
    id: `${entry.date}-${entry.clientId || entry.clientName || entry.prospectName || entry.scheduleLayer || 'entry'}-${entry.startTime || ''}-${entry.endTime || ''}`,
    person: displayName(entry),
    label: displayLabel(entry),
    color: color.value,
  };
}

export async function readThiccTimeWeekMirror(date = new Date()) {
  if (typeof window === 'undefined') {
    return { ...EMPTY_THICC_TIME_WEEK_MIRROR, weekDays: getThiccTimeWeekDays(date) };
  }

  try {
    const rows = await fetchScheduleEntries();
    const entriesByDate = groupScheduleEntriesByDate(Array.isArray(rows) ? rows : []);
    const weekStart = getThiccTimeWeekStart(date);
    const payload = buildThiccTimeAssurerPayload(entriesByDate, weekStart);
    const weekDays = getThiccTimeWeekDays(date);
    const entries = (Array.isArray(payload?.entries) ? payload.entries : []).map(normalizeWeekEntry);
    const daysWithEntries = weekDays.map((day) => ({
      ...day,
      entries: entries.filter((entry) => entry.date === day.dateKey),
    }));

    return {
      source: 'THICC.TIME',
      weekStart: toLocalIsoDate(weekStart),
      weekDays: daysWithEntries,
      entries,
      sourceFound: true,
    };
  } catch (error) {
    console.warn('THE.ASSURER THICC.TIME week mirror read failed', error);
    return { ...EMPTY_THICC_TIME_WEEK_MIRROR, weekDays: getThiccTimeWeekDays(date) };
  }
}
