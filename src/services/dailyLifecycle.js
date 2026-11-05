export const COMPLETED_DAY_LIFECYCLE_STATUS = 'complete_tested_archived';
export const PERSONAL_DAILY_RESET_VERSION = '2026-11-05-v2';

const THICC_FITT_DAY_STORAGE_KEY = 'thicc_fitt_day';
const THICC_FITT_DAYS_STORAGE_KEY = 'truthinstyle_thicc_fitt_days_v2';
const THICC_FITT_WEEKS_STORAGE_KEY = 'truthinstyle_thicc_fitt_weeks_v1';
const TWERK_SAUCE_STORAGE_KEY = 'truthinstyle_thicc_fitt_twerk_sauce_v1';
const DA_EATER_DAYS_STORAGE_KEY = 'truthinstyle_da_eater_days_v1';
const ASSURER_FEED_KEY = 'the_assurer_feed';
const PERSONAL_DAILY_RESET_RECOVERY_KEY = 'truthinstyle_personal_daily_reset_recovery_v1';

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function validDateKey(value) {
  const dateKey = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : '';
}

function hasStoredValue(value) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return String(value).trim().length > 0;
}

function writeDatedStoreWithout(storage, storageKey, dateKey) {
  const days = safeParse(storage.getItem(storageKey), {});
  if (!days || typeof days !== 'object' || Array.isArray(days) || !(dateKey in days)) {
    return { previous: null, changed: false };
  }

  const previous = days[dateKey];
  const nextDays = { ...days };
  delete nextDays[dateKey];
  storage.setItem(storageKey, JSON.stringify(nextDays));
  return { previous, changed: true };
}

function clearThiccFittWeeklyDay(storage, dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { previous: null, changed: false };
  const weekStartDate = new Date(date);
  weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay());
  const weekStart = `${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}`;
  const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()];
  const weeks = safeParse(storage.getItem(THICC_FITT_WEEKS_STORAGE_KEY), {});
  const week = weeks?.[weekStart];
  if (!week) return { previous: null, changed: false };
  const previous = week?.byDay?.[dayName] || null;
  weeks[weekStart] = {
    ...week,
    byDay: {
      ...week.byDay,
      [dayName]: {
        training: { gymMinutes: 0, cardioMinutes: 0 },
        caffeineMg: '',
        sleep: {},
      },
    },
  };
  storage.setItem(THICC_FITT_WEEKS_STORAGE_KEY, JSON.stringify(weeks));
  return { previous, changed: true };
}

/**
 * Starts a genuinely blank personal draft for one date without touching the
 * sealed day, HOPEWOOD, REMEMBER.ME, or any ITS.GETTING.THICC client records.
 * Any displaced unsealed personal draft is retained in a local recovery log.
 */
export function resetPersonalDailyDraftForDate(sourceDate, options = {}) {
  const dateKey = validDateKey(sourceDate);
  const storage = options.storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!dateKey || !storage) return { dateKey, reset: false, recovered: false };

  const resetAt = options.resetAt || new Date().toISOString();
  const reason = String(options.reason || 'summation-rollover');
  const thiccFitt = writeDatedStoreWithout(storage, THICC_FITT_DAYS_STORAGE_KEY, dateKey);
  const daEater = writeDatedStoreWithout(storage, DA_EATER_DAYS_STORAGE_KEY, dateKey);
  const weeklyTrackerDay = clearThiccFittWeeklyDay(storage, dateKey);
  const datedTwerkSauceKey = `${TWERK_SAUCE_STORAGE_KEY}:${dateKey}`;
  const datedTwerkSauce = safeParse(storage.getItem(datedTwerkSauceKey), null);
  if (datedTwerkSauce) storage.removeItem(datedTwerkSauceKey);
  const legacyTwerkSauce = safeParse(storage.getItem(TWERK_SAUCE_STORAGE_KEY), null);
  if (legacyTwerkSauce) storage.removeItem(TWERK_SAUCE_STORAGE_KEY);

  const legacyThiccFitt = safeParse(storage.getItem(THICC_FITT_DAY_STORAGE_KEY), null);
  const matchingLegacyThiccFitt = legacyThiccFitt?.date === dateKey ? legacyThiccFitt : null;
  if (matchingLegacyThiccFitt) storage.removeItem(THICC_FITT_DAY_STORAGE_KEY);

  const assurerFeed = safeParse(storage.getItem(ASSURER_FEED_KEY), []);
  const feedEntries = Array.isArray(assurerFeed)
    ? assurerFeed.filter((entry) => entry?.source === 'thicc-fitt' && String(entry?.date || '') === dateKey)
    : [];
  if (feedEntries.length) {
    storage.setItem(ASSURER_FEED_KEY, JSON.stringify(
      assurerFeed.filter((entry) => !(entry?.source === 'thicc-fitt' && String(entry?.date || '') === dateKey)),
    ));
  }

  const recoveryPayload = {
    dateKey,
    resetAt,
    reason,
    thiccFitt: thiccFitt.previous,
    daEater: daEater.previous,
    weeklyTrackerDay: weeklyTrackerDay.previous,
    twerkSauce: datedTwerkSauce || legacyTwerkSauce,
    legacyThiccFitt: matchingLegacyThiccFitt,
    assurerFeed: feedEntries,
  };
  const recovered = [thiccFitt.previous, daEater.previous, weeklyTrackerDay.previous, datedTwerkSauce, legacyTwerkSauce, matchingLegacyThiccFitt, feedEntries]
    .some(hasStoredValue);

  if (recovered) {
    const existingRecovery = safeParse(storage.getItem(PERSONAL_DAILY_RESET_RECOVERY_KEY), []);
    const recovery = Array.isArray(existingRecovery) ? existingRecovery : [];
    storage.setItem(PERSONAL_DAILY_RESET_RECOVERY_KEY, JSON.stringify([...recovery, recoveryPayload].slice(-12)));
  }

  return {
    dateKey,
    reset: true,
    recovered,
    resetAt,
    version: PERSONAL_DAILY_RESET_VERSION,
  };
}

export function countArchivedDaysThrough(records = [], requestedDateKey = '') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(requestedDateKey || '').trim())) return 0;
  return new Set(
    (Array.isArray(records) ? records : [])
      .filter((record) => record?.lifecycleStatus === COMPLETED_DAY_LIFECYCLE_STATUS)
      .map((record) => String(record?.sourceDate || record?.dayIdentity?.sourceDate || '').trim())
      .filter((sourceDate) => /^\d{4}-\d{2}-\d{2}$/.test(sourceDate) && sourceDate <= requestedDateKey),
  ).size;
}

export function getNextDaySourceDate(sourceDate = '') {
  const match = String(sourceDate || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
