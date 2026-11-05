import { getLocalDateKey } from '../../lib/theAssurer/localDateKey.js';

export const THICC_FITT_WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const minutesFromTime = (time) => {
  const match = String(time || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return (hours * 60) + minutes;
};

export function calculateSleepMinutes(start, wake) {
  const startMinutes = minutesFromTime(start);
  const wakeMinutes = minutesFromTime(wake);
  if (startMinutes === null || wakeMinutes === null) return null;
  let total = wakeMinutes - startMinutes;
  if (total < 0) total += 24 * 60;
  return total;
}

export function formatSleepTotal(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0h 00m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

export function getThiccFittWeekStartKey(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return getLocalDateKey(date);
}

function dateKeyForWeekDay(weekStart, dayIndex) {
  const date = new Date(`${weekStart}T00:00:00`);
  date.setDate(date.getDate() + dayIndex);
  return getLocalDateKey(date);
}

function hasText(value) {
  return String(value ?? '').trim().length > 0;
}

function mergeRecoveredDay(target = {}, source = {}) {
  const sourceTraining = source.training || {};
  const sourceSleep = source.sleep || {};
  const next = {
    ...target,
    training: { ...(target.training || {}) },
    sleep: { ...(target.sleep || {}) },
  };

  if (Number(sourceTraining.gymMinutes) > 0) next.training.gymMinutes = Number(sourceTraining.gymMinutes);
  if (Number(sourceTraining.cardioMinutes) > 0) next.training.cardioMinutes = Number(sourceTraining.cardioMinutes);
  if (hasText(source.caffeineMg)) next.caffeineMg = String(source.caffeineMg);
  for (const [key, value] of Object.entries(sourceSleep)) {
    if (hasText(value)) next.sleep[key] = value;
  }
  return next;
}

/**
 * Recovers a weekly tracker from existing dated drafts. Once a dedicated
 * weekly record exists it is authoritative, including intentional clears.
 */
export function resolveThiccFittWeeklyTracker(days = {}, weeks = {}, activeDateKey = '') {
  const weekStart = getThiccFittWeekStartKey(activeDateKey);
  if (!weekStart) return null;
  const storedWeek = weeks?.[weekStart];
  if (storedWeek?.byDay) return storedWeek;

  const recovered = { weekStart, byDay: {} };
  THICC_FITT_WEEK_DAYS.forEach((day, index) => {
    const dateKey = dateKeyForWeekDay(weekStart, index);
    const draft = days?.[dateKey];
    const weeklyDay = draft?.weeklyTrackers?.weekStart === weekStart
      ? draft.weeklyTrackers?.byDay?.[day]
      : null;
    let merged = mergeRecoveredDay({}, weeklyDay || {});
    if (draft?.dailySleep || draft?.sleepSignal) {
      merged = mergeRecoveredDay(merged, { sleep: draft.dailySleep || draft.sleepSignal });
    }
    recovered.byDay[day] = merged;
  });
  return recovered;
}

export function calculateWeeklySleepSummary(byDay = {}) {
  const minutes = THICC_FITT_WEEK_DAYS
    .map((day) => {
      const sleep = byDay?.[day]?.sleep || {};
      return calculateSleepMinutes(
        sleep.sleep_start || sleep.bedtime,
        sleep.wake_time || sleep.wakeTime,
      );
    })
    .filter((value) => Number.isFinite(value) && value > 0);
  const totalMinutes = minutes.reduce((sum, value) => sum + value, 0);
  const loggedNights = minutes.length;
  return {
    totalMinutes,
    totalLabel: formatSleepTotal(totalMinutes),
    loggedNights,
    averageHours: loggedNights ? (totalMinutes / loggedNights / 60).toFixed(1) : '0.0',
  };
}
