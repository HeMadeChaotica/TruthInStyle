const THICC_FITT_STORAGE_KEY = 'thicc_fitt_day';
const ASSURER_FEED_KEY = 'the_assurer_feed';

export const EMPTY_THICC_FITT_WORKOUT_MIRROR = {
  source: 'THICC.FITT',
  date: '',
  control: {},
  exerciseRows: [],
  core: {},
  cardio: {},
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

function readLatestPublishedProof(dateKey) {
  if (typeof window === 'undefined') {
    return null;
  }

  const feed = safeJsonParse(window.localStorage.getItem(ASSURER_FEED_KEY), []);
  if (!Array.isArray(feed)) {
    return null;
  }

  const thiccFittProofs = feed
    .filter((entry) => entry?.source === 'thicc-fitt' && (!dateKey || entry.date === dateKey))
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  return thiccFittProofs[0] || null;
}

function compactExerciseRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.exercise || row?.weight || row?.reps || row?.sets || row?.rest)
    .map((row, index) => ({
      id: `${index}-${row.exercise || 'exercise'}`,
      exercise: row.exercise || `EXERCISE ${index + 1}`,
      weight: row.weight || '',
      reps: row.reps || '',
      sets: row.sets || '',
      failure: row.failure || '',
      rest: row.rest || '',
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

function normalizeWorkoutMirror(payload = {}, proof = null) {
  const control = payload.control || proof?.trainingTopValues || {};
  const exerciseRows = compactExerciseRows(payload.exerciseRows || proof?.exerciseLogRows || []);
  const core = payload.core || proof?.coreAbFinisher || {};
  const cardio = payload.cardio || proof?.cardio || {};
  const weeklySummary = summarizeWeeklyTrackers(payload.weeklyTrackers || {});

  return {
    source: 'THICC.FITT',
    date: proof?.date || '',
    control,
    exerciseRows,
    core,
    cardio,
    weeklySummary,
    sessionCompleted: payload.sessionCompleted || proof?.completed || '',
    notes: payload.soHowYouDoinNotes || proof?.soHowYouDoinNotes || '',
  };
}

export function readThiccFittWorkoutMirror(dateKey = '') {
  if (typeof window === 'undefined') {
    return EMPTY_THICC_FITT_WORKOUT_MIRROR;
  }

  const currentDay = safeJsonParse(window.localStorage.getItem(THICC_FITT_STORAGE_KEY), null);
  const latestProof = readLatestPublishedProof(dateKey);

  if (!currentDay && !latestProof) {
    return EMPTY_THICC_FITT_WORKOUT_MIRROR;
  }

  return normalizeWorkoutMirror(currentDay || {}, latestProof);
}
