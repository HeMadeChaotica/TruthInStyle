const THICC_FITT_STORAGE_KEY = 'thicc_fitt_day';
const ASSURER_FEED_KEY = 'the_assurer_feed';

export const EMPTY_THICC_FITT_WORKOUT_MIRROR = {
  source: 'THICC.FITT',
  date: '',
  hasData: false,
  workout: {
    completed: '',
    duration: '',
    seasonPhase: '',
  },
  control: {},
  exerciseRows: [],
  cardio: {},
  recovery: {
    soreness: '',
    status: '',
  },
  vault: {
    compoundSummary: '',
    cycleWeek: '',
    shotTrackingSummary: '',
  },
  dailySignals: {
    soHowYouDoin: '',
    notes: '',
  },
  media: {
    latestTrophyWallImageRef: '',
  },
  sleep: {
    sleep_start: '',
    wake_time: '',
    sleep_total: '',
    sleep_quality: '',
    sleep_notes: '',
    isValid: false,
  },
  weeklySummary: {
    daysTrained: 0,
    gymMinutes: 0,
    cardioMinutes: 0,
    totalMinutes: 0,
  },
  sessionCompleted: '',
  notes: '',
};

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeDateKeys(dateKeys) {
  return Array.isArray(dateKeys) ? dateKeys.filter(Boolean).map(String) : [dateKeys].filter(Boolean).map(String);
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
  if (Array.isArray(value)) return value.some(hasValue);
  if (typeof value === 'object') return Object.values(value).some(hasValue);
  return Boolean(value);
}

function cleanText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function compactExerciseRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => hasValue(row?.exercise) || hasValue(row?.weight) || hasValue(row?.reps) || hasValue(row?.sets) || hasValue(row?.rest))
    .map((row, index) => ({
      id: `${index}-${cleanText(row.exercise) || 'exercise'}`,
      exercise: cleanText(row.exercise) || `EXERCISE ${index + 1}`,
      weight: cleanText(row.weight),
      reps: cleanText(row.reps),
      sets: cleanText(row.sets),
      failure: cleanText(row.failure),
      rest: cleanText(row.rest),
    }));
}

function summarizeWeeklyTrackers(weeklyTrackers = {}) {
  const byDay = weeklyTrackers.byDay || {};
  const days = Object.values(byDay);

  return days.reduce((summary, day) => {
    const gymMinutes = Number(day?.training?.gymMinutes || 0);
    const cardioMinutes = Number(day?.training?.cardioMinutes || 0);
    const totalMinutes = gymMinutes + cardioMinutes;

    return {
      daysTrained: summary.daysTrained + (totalMinutes > 0 ? 1 : 0),
      gymMinutes: summary.gymMinutes + gymMinutes,
      cardioMinutes: summary.cardioMinutes + cardioMinutes,
      totalMinutes: summary.totalMinutes + totalMinutes,
    };
  }, { daysTrained: 0, gymMinutes: 0, cardioMinutes: 0, totalMinutes: 0 });
}

function photoLabel(photoRef) {
  if (!photoRef) return '';
  if (typeof photoRef === 'string') return photoRef.trim();
  return cleanText(photoRef.name) || cleanText(photoRef.id) || cleanText(photoRef.handleName) || cleanText(photoRef.path) || 'MEDIA REFERENCE SAVED';
}

function latestTrophyWallImageRef(photo = {}) {
  return photoLabel(photo.progressPhotoRef) || photoLabel(photo.gymPhotoRef);
}

function compactParts(parts) {
  return parts.map(cleanText).filter(Boolean).join(' • ');
}

function cycleWeekLabel(vault = {}) {
  const current = cleanText(vault.cycleWeekCurrent);
  const total = cleanText(vault.cycleWeekTotal);
  if (current && total) return `${current} / ${total}`;
  return current || total;
}

function shotTrackingLabel(vault = {}) {
  const current = cleanText(vault.shotCurrent);
  const total = cleanText(vault.shotTotal);
  if (current && total) return `${current} / ${total}`;
  return current || total;
}


function normalizeSleepSignal(payload = {}) {
  const sleepPayload = payload.dailySleep || payload.sleepSignal || payload.sleep || {};
  const sleepStart = cleanText(sleepPayload.sleep_start || sleepPayload.sleepStart || sleepPayload.bedtime || payload.sleep_start);
  const wakeTime = cleanText(sleepPayload.wake_time || sleepPayload.wakeTime || payload.wake_time);
  const sleepTotal = cleanText(sleepPayload.sleep_total || sleepPayload.hoursSlept || payload.sleep_total);
  const isValid = Boolean(sleepStart && wakeTime && sleepTotal);

  return {
    sleep_start: sleepStart,
    wake_time: wakeTime,
    sleep_total: isValid ? sleepTotal : '',
    sleep_quality: cleanText(sleepPayload.sleep_quality || sleepPayload.quality || payload.sleep_quality),
    sleep_notes: cleanText(sleepPayload.sleep_notes || sleepPayload.recoveryNotes || payload.sleep_notes),
    isValid,
  };
}

function normalizeWorkoutPayload(payload = {}) {
  return {
    ...payload,
    control: payload.control || payload.trainingTopValues || {},
    exerciseRows: payload.exerciseRows || payload.exerciseLogRows || [],
    core: payload.core || payload.coreAbFinisher || {},
    cardio: payload.cardio || {},
    body: payload.body || payload.bodyGrowthSummary || {},
    soHowYouDoin: payload.soHowYouDoin || payload.soHowYouDoinSelectedOption || '',
    soHowYouDoinNotes: payload.soHowYouDoinNotes || '',
    photo: payload.photo || { progressPhotoRef: payload.sessionPhoto || '' },
    sessionCompleted: payload.sessionCompleted || payload.completed || '',
  };
}

function normalizeWorkoutMirror(payload = {}) {
  const normalizedPayload = normalizeWorkoutPayload(payload);
  const control = normalizedPayload.control || {};
  const cardio = normalizedPayload.cardio || {};
  const vault = normalizedPayload.vault || {};
  const exerciseRows = compactExerciseRows(normalizedPayload.exerciseRows || []);
  const weeklySummary = summarizeWeeklyTrackers(normalizedPayload.weeklyTrackers || {});
  const recovery = {
    soreness: cleanText(control.sorenessRecovery),
    status: cleanText(control.prepStatus),
  };
  const dailySignals = {
    soHowYouDoin: cleanText(normalizedPayload.soHowYouDoin),
    notes: cleanText(normalizedPayload.soHowYouDoinNotes),
  };
  const media = {
    latestTrophyWallImageRef: latestTrophyWallImageRef(normalizedPayload.photo || {}),
  };
  const sleep = normalizeSleepSignal(normalizedPayload);
  const normalized = {
    source: 'THICC.FITT',
    date: cleanText(normalizedPayload.date),
    hasData: false,
    workout: {
      completed: cleanText(normalizedPayload.sessionCompleted),
      duration: cleanText(control.workoutLength),
      seasonPhase: cleanText(control.seasonPhase),
    },
    control,
    exerciseRows,
    cardio: {
      type: cleanText(cardio.type),
      duration: cleanText(cardio.duration),
      intensity: cleanText(cardio.intensity),
      location: cleanText(cardio.location),
      notes: cleanText(cardio.notes),
    },
    recovery,
    vault: {
      compoundSummary: compactParts([vault.compound, vault.ester, vault.amount]),
      cycleWeek: cycleWeekLabel(vault),
      shotTrackingSummary: shotTrackingLabel(vault),
    },
    dailySignals,
    media,
    sleep,
    weeklySummary,
    sessionCompleted: cleanText(normalizedPayload.sessionCompleted),
    notes: dailySignals.notes,
  };

  normalized.hasData = hasValue({
    workout: normalized.workout,
    exerciseRows: normalized.exerciseRows,
    cardio: normalized.cardio,
    recovery: normalized.recovery,
    vault: normalized.vault,
    dailySignals: normalized.dailySignals,
    media: normalized.media,
    sleep: normalized.sleep,
    weeklySummary: normalized.weeklySummary,
  });

  return normalized;
}

function readThiccFittFeed() {
  const parsed = safeJsonParse(window.localStorage.getItem(ASSURER_FEED_KEY), []);
  return Array.isArray(parsed) ? parsed : [];
}

function matchesDate(payload, dateKeys) {
  if (!dateKeys.length) return true;
  const payloadDate = cleanText(payload?.date);
  return payloadDate ? dateKeys.includes(payloadDate) : false;
}

function findFeedPayload(feed, dateKeys) {
  const thiccFittEntries = feed.filter((entry) => entry?.source === 'thicc-fitt');
  for (const dateKey of dateKeys) {
    const matchingEntries = thiccFittEntries.filter((entry) => cleanText(entry?.date) === dateKey);
    if (matchingEntries.length) {
      return matchingEntries[matchingEntries.length - 1];
    }
  }
  return null;
}

function resolveWorkoutPayload(currentDay, feed, dateKeys) {
  if (!dateKeys.length) return currentDay || findFeedPayload(feed, dateKeys);

  const currentDate = cleanText(currentDay?.date);
  if (currentDay && currentDate === dateKeys[0]) return currentDay;

  const preferredFeedPayload = findFeedPayload(feed, dateKeys.slice(0, 1));
  if (preferredFeedPayload) return preferredFeedPayload;

  if (currentDay && !currentDate) return { ...currentDay, date: dateKeys[0] };
  if (currentDay && matchesDate(currentDay, dateKeys)) return currentDay;

  return findFeedPayload(feed, dateKeys);
}

export function readThiccFittWorkoutMirror(dateKeys = []) {
  if (typeof window === 'undefined') {
    return EMPTY_THICC_FITT_WORKOUT_MIRROR;
  }

  const requestedDateKeys = normalizeDateKeys(dateKeys);
  const currentDay = safeJsonParse(window.localStorage.getItem(THICC_FITT_STORAGE_KEY), null);
  const feed = readThiccFittFeed();
  const workoutPayload = resolveWorkoutPayload(currentDay, feed, requestedDateKeys);

  if (!workoutPayload) {
    return EMPTY_THICC_FITT_WORKOUT_MIRROR;
  }

  return normalizeWorkoutMirror(workoutPayload);
}
