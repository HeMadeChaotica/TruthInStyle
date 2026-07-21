import { getHopewoodRecordDate, readHopewoodSummationArchive } from './hopewoodService';

function cleanText(value) {
  return String(value ?? '').trim();
}

function present(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(cleanText(value));
}

function addCount(map, value) {
  const label = cleanText(value);
  if (!label) return;
  map.set(label, (map.get(label) || 0) + 1);
}

function ranked(map, limit = 5) {
  return [...map.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function list(value) {
  if (Array.isArray(value)) return value.filter(present);
  if (value && typeof value === 'object') return Object.values(value).flatMap(list);
  return present(value) ? [value] : [];
}

export function availableHopewoodYears(records = readHopewoodSummationArchive()) {
  return [...new Set(records.map((record) => getHopewoodRecordDate(record).slice(0, 4)).filter(Boolean))]
    .sort((left, right) => right.localeCompare(left));
}

export function buildAnnual525600Intelligence(records = readHopewoodSummationArchive(), requestedYear = '') {
  const years = availableHopewoodYears(records);
  const year = cleanText(requestedYear) || years[0] || String(new Date().getFullYear());
  const yearRecords = records
    .filter((record) => getHopewoodRecordDate(record).startsWith(`${year}-`))
    .sort((left, right) => getHopewoodRecordDate(left).localeCompare(getHopewoodRecordDate(right)));
  const moods = new Map();
  const eras = new Map();
  const singleness = new Map();
  const words = new Map();
  let mealSignals = 0;
  let workoutSignals = 0;
  let rememberedMoments = 0;

  yearRecords.forEach((record) => {
    const truth = record?.sourceTruthSnapshot || record?.fullAssurerDaySnapshot || {};
    const signals = record?.sourceSignals || record?.future525600?.sourceSignals || {};
    addCount(moods, record?.mood || truth?.mood);
    addCount(eras, record?.era || truth?.era);
    addCount(singleness, record?.singleness || truth?.singlenessLevel || truth?.singleness);
    addCount(words, truth?.wordOfDay?.word || truth?.wordOfDay);
    mealSignals += list(signals?.daEater || truth?.mealHighlights || truth?.macroHighlights).length;
    workoutSignals += list(signals?.thiccFitt || truth?.workoutHighlights).length;
    rememberedMoments += list(signals?.rememberMe || truth?.moments || truth?.timelineHighlights).length;
  });

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
    records: yearRecords,
    sealedDays: yearRecords.length,
    coveragePercent: Math.round((yearRecords.length / (new Date(Number(year), 1, 29).getDate() === 29 ? 366 : 365)) * 100),
    months,
    patterns: {
      moods: ranked(moods),
      eras: ranked(eras),
      singleness: ranked(singleness),
      words: ranked(words),
    },
    totals: { mealSignals, workoutSignals, rememberedMoments },
  };
}
