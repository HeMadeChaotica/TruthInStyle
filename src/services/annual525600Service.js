import { getHopewoodRecordDate, readHopewoodSummationArchive } from './hopewoodService.js';
import { cleanAnalyticsText, filterRecordsByWindow, normalizeDayCapsuleRecord } from './dayCapsuleAnalytics.js';

function addCount(map, value) {
  const label = cleanAnalyticsText(value);
  if (label) map.set(label, (map.get(label) || 0) + 1);
}

function ranked(map, limit = 6) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function topText(days, key, limit = 5) {
  const counts = new Map();
  days.flatMap((day) => Array.isArray(day[key]) ? day[key] : [day[key]])
    .forEach((value) => addCount(counts, value));
  return ranked(counts, limit);
}

function numericTrend(days, key) {
  const points = days.filter((day) => Number.isFinite(day[key])).map((day) => ({ date: day.sourceDate, value: day[key] }));
  if (!points.length) return { points: [], first: null, latest: null, change: null };
  const first = points[0].value;
  const latest = points[points.length - 1].value;
  return { points, first, latest, change: Number((latest - first).toFixed(2)) };
}

function verdict(days, emotional, words) {
  const strongest = days.filter((day) => day.tone === 'victory').at(-1) || days.at(-1);
  const hardest = days.filter((day) => day.tone === 'critical' || day.tone === 'intense').at(-1);
  return {
    dominantMood: emotional.moods[0]?.label || '',
    dominantEra: emotional.eras[0]?.label || '',
    definingWord: words.words[0]?.label || '',
    biggestWin: strongest?.title || '',
    hardestPattern: hardest ? [hardest.mood, hardest.era, hardest.lobito].filter(Boolean).join(' + ') : '',
    goodBroAnswer: emotional.criticalDays
      ? `${emotional.criticalDays} high-intensity day${emotional.criticalDays === 1 ? '' : 's'} need a closer look.`
      : 'The sealed record shows no critical-intensity days in this window.',
  };
}

export function availableHopewoodYears(records = readHopewoodSummationArchive()) {
  return [...new Set(records.map((record) => getHopewoodRecordDate(record).slice(0, 4)).filter(Boolean))]
    .sort((left, right) => right.localeCompare(left));
}

export function buildAnnual525600Intelligence(records = readHopewoodSummationArchive(), options = {}) {
  const requestedYear = typeof options === 'string' ? options : options.year;
  const windowKey = typeof options === 'object' ? options.windowKey || 'year' : 'year';
  const years = availableHopewoodYears(records);
  const year = cleanAnalyticsText(requestedYear) || years[0] || String(new Date().getFullYear());
  const yearRecords = records
    .filter((record) => getHopewoodRecordDate(record).startsWith(`${year}-`))
    .sort((left, right) => getHopewoodRecordDate(left).localeCompare(getHopewoodRecordDate(right)));
  const windowRecords = windowKey === 'year' ? yearRecords : filterRecordsByWindow(records, windowKey);
  const days = windowRecords.map(normalizeDayCapsuleRecord);

  const moodMap = new Map();
  const eraMap = new Map();
  const lobitoMap = new Map();
  const comboMap = new Map();
  const singlenessMap = new Map();
  days.forEach((day) => {
    addCount(moodMap, day.mood);
    addCount(eraMap, day.era);
    addCount(lobitoMap, day.lobito);
    addCount(singlenessMap, day.singleness);
    addCount(comboMap, [day.mood, day.era, day.lobito].filter(Boolean).join(' + '));
  });

  const emotional = {
    moods: ranked(moodMap),
    eras: ranked(eraMap),
    lobito: ranked(lobitoMap),
    combinations: ranked(comboMap),
    singleness: ranked(singlenessMap),
    intenseDays: days.filter((day) => ['intense', 'critical'].includes(day.tone)).length,
    criticalDays: days.filter((day) => day.tone === 'critical').length,
    victoryDays: days.filter((day) => day.tone === 'victory').length,
  };
  const words = {
    words: topText(days, 'word'),
    penny: topText(days, 'pennyAnswers'),
    assured: topText(days, 'assuredThoughts'),
    battleCries: topText(days, 'battleCry'),
  };
  const memory = {
    total: days.reduce((sum, day) => sum + day.moments.length, 0),
    highlights: topText(days, 'moments', 8),
  };
  const nutrition = {
    loggedDays: days.filter((day) => day.meals.length).length,
    signals: days.reduce((sum, day) => sum + day.meals.length, 0),
    highlights: topText(days, 'meals', 8),
  };
  const strength = {
    trainedDays: days.filter((day) => day.workouts.length).length,
    signals: days.reduce((sum, day) => sum + day.workouts.length, 0),
    highlights: topText(days, 'workouts', 8),
    weight: numericTrend(days, 'weight'),
    bmi: numericTrend(days, 'bmi'),
    bodyFat: numericTrend(days, 'bodyFat'),
  };
  const discipline = {
    scheduledDays: days.filter((day) => day.schedule.length).length,
    scheduleSignals: days.reduce((sum, day) => sum + day.schedule.length, 0),
    sleepDays: days.filter((day) => day.sleep).length,
    highlights: topText(days, 'schedule', 8),
  };
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0');
    return {
      month,
      label: new Date(`${year}-${month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      count: yearRecords.filter((record) => getHopewoodRecordDate(record).slice(5, 7) === month).length,
    };
  });

  return {
    year,
    years,
    windowKey,
    records: windowRecords,
    days,
    sealedDays: days.length,
    coveragePercent: Math.round((yearRecords.length / (new Date(Number(year), 1, 29).getDate() === 29 ? 366 : 365)) * 100),
    months,
    emotional,
    words,
    memory,
    nutrition,
    strength,
    discipline,
    verdict: verdict(days, emotional, words),
  };
}
