const THICC_FITT_STORAGE_KEY = 'thicc_fitt_day';

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

function normalizeWorkoutMirror(payload = {}) {
  const control = payload.control || {};
  const cardio = payload.cardio || {};
  const vault = payload.vault || {};
  const exerciseRows = compactExerciseRows(payload.exerciseRows || []);
  const weeklySummary = summarizeWeeklyTrackers(payload.weeklyTrackers || {});
  const recovery = {
    soreness: cleanText(control.sorenessRecovery),
    status: cleanText(control.prepStatus),
  };
  const dailySignals = {
    soHowYouDoin: cleanText(payload.soHowYouDoin),
    notes: cleanText(payload.soHowYouDoinNotes),
  };
  const media = {
    latestTrophyWallImageRef: latestTrophyWallImageRef(payload.photo || {}),
  };
  const normalized = {
    source: 'THICC.FITT',
    date: cleanText(payload.date),
    hasData: false,
    workout: {
      completed: cleanText(payload.sessionCompleted),
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
    weeklySummary,
    sessionCompleted: cleanText(payload.sessionCompleted),
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
    weeklySummary: normalized.weeklySummary,
  });

  return normalized;
}

export function readThiccFittWorkoutMirror() {
  if (typeof window === 'undefined') {
    return EMPTY_THICC_FITT_WORKOUT_MIRROR;
  }

  const currentDay = safeJsonParse(window.localStorage.getItem(THICC_FITT_STORAGE_KEY), null);

  if (!currentDay) {
    return EMPTY_THICC_FITT_WORKOUT_MIRROR;
  }

  return normalizeWorkoutMirror(currentDay);
}
