import { fetchRememberMeEntriesSafe } from '../../src/services/rememberMeService';

const MOMENT_TYPE_VALUES = new Set(['WOW', 'WTF', 'PLOT TWIST']);

export const EMPTY_REMEMBER_ME_DAY_TIMELINE = {
  source: 'REMEMBER.ME EVENTS',
  dateKey: '',
  entries: [],
  sourceFound: false,
};

export function getRememberMeDayTimelineDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
}

function normalizeEventType(value) {
  return String(value || '').trim().toUpperCase();
}

function isMomentType(value) {
  return MOMENT_TYPE_VALUES.has(normalizeEventType(value));
}

function timelineEntryColor(row = {}, type = '') {
  const normalizedType = normalizeEventType(type);
  const scheduleKind = String(row.schedule_kind || '').trim().toLowerCase();
  if (scheduleKind === 'popup') return '#2b8f92';
  if (scheduleKind === 'work') return '#b47726';
  if (normalizedType === 'PAYDAY' || normalizedType === 'RENT') return '#8a5d10';
  if (normalizedType.includes('WORK') || normalizedType.includes('JOB') || normalizedType === 'MEETING' || normalizedType === 'DEADLINE') return '#884a2c';
  if (normalizedType.includes('BIRTHDAY') || normalizedType.includes('ANNIVERSARY') || normalizedType === 'TREAT DAY' || normalizedType === 'HAIRCUT') return '#a83b6f';
  if (normalizedType === 'DATE' || normalizedType.includes('DICK APPOINTMENT') || normalizedType.includes('SOCIAL')) return '#91406f';
  if (normalizedType === 'HEALTH') return '#416c5a';
  if (normalizedType.includes('TRAVEL') || normalizedType.includes('PACKAGE')) return '#776415';
  if (normalizedType === 'CALL' || normalizedType === 'REMINDER') return '#53608c';
  return '#9a3d63';
}

function normalizeTimelineEntry(row = {}) {
  if (!row || typeof row !== 'object') return null;
  const type = normalizeEventType(row.entry_type || row.type);
  if (!type || isMomentType(type)) return null;

  const id = String(row.id || `${row.date_key || ''}-${type}-${row.time_value || row.time || ''}`);
  const time = String(row.time_value || row.time || '').trim();
  const endTime = String(row.end_time || row.endTime || '').trim();
  const detail = String(row.detail || '').trim();
  const description = String(row.description || '').trim();
  const label = String(row.label || description || detail || type).trim();
  const scheduleKind = String(row.schedule_kind || '').trim().toLowerCase();

  return {
    id,
    dateKey: String(row.date_key || '').trim(),
    time,
    startTime: time,
    endTime,
    type,
    label,
    person: scheduleKind === 'popup' ? 'POP-UP' : scheduleKind === 'work' ? 'WORK' : type,
    color: timelineEntryColor(row, type),
    detail,
    description,
    text: description || detail || type,
    mediaRef: String(row.mediaRef || row.photoRef || row.persistedMediaRef || '').trim(),
  };
}

export async function readRememberMeDayTimelineMirror(dateKey = getRememberMeDayTimelineDateKey()) {
  if (!dateKey || typeof window === 'undefined') {
    return { ...EMPTY_REMEMBER_ME_DAY_TIMELINE, dateKey };
  }

  try {
    const result = await fetchRememberMeEntriesSafe();
    const sourceRows = Array.isArray(result?.rows) ? result.rows : [];
    const entries = sourceRows
      .filter((row) => String(row?.date_key || '').trim() === dateKey)
      .map(normalizeTimelineEntry)
      .filter(Boolean)
      .sort((a, b) => String(a.time).localeCompare(String(b.time)) || String(a.type).localeCompare(String(b.type)));

    return {
      source: 'REMEMBER.ME EVENTS',
      dateKey,
      entries,
      sourceFound: true,
      storageSource: result?.source || '',
    };
  } catch (error) {
    console.warn('THE.ASSURER REMEMBER.ME day timeline mirror read failed', error);
    return { ...EMPTY_REMEMBER_ME_DAY_TIMELINE, dateKey };
  }
}
