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

function normalizeTimelineEntry(row = {}) {
  if (!row || typeof row !== 'object') return null;
  const type = normalizeEventType(row.entry_type || row.type);
  if (!type || isMomentType(type)) return null;

  const id = String(row.id || `${row.date_key || ''}-${type}-${row.time_value || row.time || ''}`);
  const time = String(row.time_value || row.time || '').trim();
  const detail = String(row.detail || '').trim();
  const description = String(row.description || '').trim();

  return {
    id,
    dateKey: String(row.date_key || '').trim(),
    time,
    type,
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
