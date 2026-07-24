import { getHopewoodRecordDate } from './hopewoodService.js';

export function cleanAnalyticsText(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (Array.isArray(value)) return value.map(cleanAnalyticsText).filter(Boolean).join(' • ');
  if (typeof value === 'object') {
    return cleanAnalyticsText(
      value.label || value.title || value.name || value.word || value.text || value.answer
      || value.description || value.detail || value.summary || value.value,
    );
  }
  return '';
}

export function analyticsList(value, limit = 50) {
  const source = Array.isArray(value) ? value : value && typeof value === 'object' ? Object.values(value) : [value];
  const seen = new Set();
  return source.flatMap((entry) => {
    if (Array.isArray(entry)) return analyticsList(entry, limit);
    if (entry && typeof entry === 'object' && !cleanAnalyticsText(entry)) return analyticsList(Object.values(entry), limit);
    return [cleanAnalyticsText(entry)];
  }).filter(Boolean).filter((entry) => {
    const key = entry.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

function first(...values) {
  return values.map(cleanAnalyticsText).find(Boolean) || '';
}

function recordTruth(record) {
  return record?.sourceTruthSnapshot || record?.fullAssurerDaySnapshot || {};
}

function recordSignals(record) {
  return record?.sourceSignals || record?.future525600?.sourceSignals || {};
}

function findDeep(root, names = []) {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  const queue = [root];
  const visited = new Set();
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);
    for (const [key, value] of Object.entries(current)) {
      if (wanted.has(key.toLowerCase()) && cleanAnalyticsText(value)) return value;
      if (value && typeof value === 'object') queue.push(value);
    }
  }
  return '';
}

function numeric(value) {
  const match = cleanAnalyticsText(value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function intensityFor({ mood, era, lobito, assuredThoughts }) {
  const text = [mood, era, lobito, ...assuredThoughts].join(' ').toLowerCase();
  if (/suicid|unsafe|crisis|hopeless|despair|panic|breakdown/.test(text)) return 'critical';
  if (/horny|rage|furious|chaos|chaotic|overwhelm|obsess|spiral|anxious|depress|exhaust/.test(text)) return 'intense';
  if (/win|proud|power|strong|breakthrough|joy|grateful|confident|victory/.test(text)) return 'victory';
  if (/heal|learn|reset|recover|growth|regulat|reflect/.test(text)) return 'growth';
  return 'steady';
}

export function normalizeDayCapsuleRecord(record = {}) {
  const truth = recordTruth(record);
  const signals = recordSignals(record);
  const identity = record?.dayIdentity || record?.future525600?.dayIdentity || truth?.dayIdentity || {};
  const assured = truth?.assuredThoughts || record?.assuredThoughts || {};
  const mood = first(record?.mood, truth?.mood);
  const era = first(record?.era, truth?.era);
  const lobito = first(truth?.lobito, truth?.lobitoCheckIn, findDeep(truth, ['lobito']));
  const singleness = first(record?.singleness, truth?.singlenessLevel, truth?.singleness);
  const pennyAnswers = analyticsList(
    assured?.pennyQuestions || assured?.answers || findDeep(truth, ['pennyQuestions', 'pennyAnswers']),
    8,
  );
  const assuredThoughts = analyticsList([
    assured?.diaryEntry,
    assured?.thoughts,
    truth?.assuredThoughtsText,
    ...pennyAnswers,
  ], 12);
  const moments = analyticsList([
    signals?.rememberMe,
    truth?.rememberMeMoments,
    truth?.moments,
    truth?.timelineHighlights,
  ], 20);
  const meals = analyticsList([
    signals?.daEater,
    truth?.daEaterSignals,
    truth?.mealHighlights,
    truth?.macroHighlights,
  ], 30);
  const workouts = analyticsList([
    signals?.thiccFitt,
    truth?.thiccFittSignals,
    truth?.workoutHighlights,
    truth?.exerciseSummary,
  ], 30);
  const schedule = analyticsList([
    signals?.thiccTime,
    truth?.thiccTimeSignals,
    truth?.scheduleHighlights,
  ], 20);
  const battleCry = first(
    truth?.battleCry,
    truth?.otherSignals?.battleCry,
    findDeep(truth, ['battleCry', 'quoteOfDay']),
  );
  const word = first(truth?.wordOfDay?.word, truth?.wordOfDay);
  const headHummer = first(truth?.headHummer, findDeep(truth, ['headHummer']));
  const weight = numeric(findDeep(truth, ['weight', 'currentWeight', 'bodyWeight']));
  const bmi = numeric(findDeep(truth, ['bmi', 'currentBmi']));
  const bodyFat = numeric(findDeep(truth, ['bodyFat', 'bodyFatPercent']));
  const sleep = first(findDeep(truth, ['sleepTotal', 'sleep_total', 'hoursSlept']));
  const title = first(record?.title, identity?.titleOfDay, truth?.titleOfDay) || 'UNTITLED DAY';
  const sourceDate = getHopewoodRecordDate(record);
  const tone = intensityFor({ mood, era, lobito, assuredThoughts });

  return {
    raw: record,
    id: record?.id || sourceDate,
    sourceDate,
    displayDate: first(record?.displayDate, identity?.displayDate, sourceDate),
    dayOfWeek: first(record?.dayOfWeek, identity?.dayOfWeek),
    chaoticaDayNumber: identity?.chaoticaDayNumber ?? truth?.chaoticaDayNumber ?? null,
    title,
    mood,
    era,
    lobito,
    singleness,
    word,
    headHummer,
    assuredThoughts,
    pennyAnswers,
    battleCry,
    moments,
    meals,
    workouts,
    schedule,
    weight,
    bmi,
    bodyFat,
    sleep,
    tone,
    signals,
    truth,
  };
}

export function dayCapsuleFactGroups(record) {
  const day = normalizeDayCapsuleRecord(record);
  const rows = (values) => values.filter(([, value]) => cleanAnalyticsText(value));
  return [
    { title: 'DAY IDENTITY', tone: 'identity', rows: rows([
      ['TITLE', day.title], ['DATE', day.displayDate], ['DAY', day.dayOfWeek],
      ['CHAOTICA DAY', day.chaoticaDayNumber !== null ? `#${day.chaoticaDayNumber}` : ''],
    ]) },
    { title: 'EMOTIONAL WEATHER', tone: day.tone, rows: rows([
      ['MOOD', day.mood], ['ERA', day.era], ['LOBITO', day.lobito], ['SINGLENESS', day.singleness],
      ['WORD', day.word], ['HEAD HUMMER', day.headHummer],
    ]) },
    { title: 'ASSURED TRUTHS', tone: day.tone, items: day.assuredThoughts },
    { title: 'REMEMBER.ME', tone: 'memory', items: day.moments },
    { title: 'DA.EATER', tone: 'nutrition', items: day.meals },
    { title: 'THICC.FITT', tone: 'strength', rows: rows([
      ['WEIGHT', day.weight], ['BMI', day.bmi], ['BODY FAT', day.bodyFat],
      ['SLEEP', day.sleep], ['BATTLE CRY', day.battleCry],
    ]), items: day.workouts },
    { title: 'THICC.TIME', tone: 'discipline', items: day.schedule },
  ].filter((group) => group.rows?.length || group.items?.length);
}

export function filterRecordsByWindow(records, windowKey, anchor = new Date()) {
  const days = windowKey === 'week' ? 7 : windowKey === '6m' ? 183 : windowKey === '12m' ? 366 : null;
  if (!days) return records;
  const cutoff = new Date(anchor);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days + 1);
  return records.filter((record) => {
    const date = new Date(`${getHopewoodRecordDate(record)}T00:00:00`);
    return !Number.isNaN(date.getTime()) && date >= cutoff && date <= anchor;
  });
}
