import { getBattleCryForDate } from '../../lib/theAssurer/battleCryQuotes';
import { getDaEaterStorageDate } from '../../lib/theAssurer/daEaterDateKey';
import { getDailyDateKeyCandidates, getLocalDateKey } from '../../lib/theAssurer/localDateKey';
import { ASSURER_MACRO_FALLBACK_MIRROR, readDaEaterMacroMirror } from '../../lib/theAssurer/daEaterMacroMirror';
import { EMPTY_DA_EATER_MEAL_LOG, readDaEaterMealLogForDate } from '../../lib/theAssurer/daEaterMealMirror';
import {
  EMPTY_REMEMBER_ME_DAY_TIMELINE,
  getRememberMeDayTimelineDateKey,
  readRememberMeDayTimelineMirror,
} from '../../lib/theAssurer/rememberMeDayTimelineMirror';
import {
  EMPTY_REMEMBER_ME_MOMENT_MIRROR,
  REMEMBER_ME_MOMENT_TYPES,
  getRememberMeMomentDateKey,
  readRememberMeMomentMirror,
} from '../../lib/theAssurer/rememberMeMomentMirror';
import { EMPTY_THICC_TIME_WEEK_MIRROR, getThiccTimeWeekDays, readThiccTimeWeekMirror } from '../../lib/theAssurer/thiccTimeWeekMirror';
import { EMPTY_THICC_FITT_WORKOUT_MIRROR, readThiccFittWorkoutMirror } from '../../lib/theAssurer/thiccFittWorkoutMirror';
import { receiveSealedSummation } from './hopewoodService';

const ASSURER_TITLE_STORAGE_KEY = 'the_assurer_title_of_day';
const ASSURER_WORD_STORAGE_KEY = 'the_assurer_word_of_day';
const ASSURER_DAY_STORAGE_KEY = 'the_assurer_day';
const SUMMATION_SEALED_STORAGE_KEY = 'the_summation_sealed_records_v1';
const ASSURER_DAILY_FIELD_KEYS = {
  mood: ['the_assurer_mood', 'assurer:mood'],
  era: ['the_assurer_era', 'assurer:era'],
  singlenessLevel: ['the_assurer_singleness_level', 'assurer:singlenessLevel'],
  location: ['the_assurer_location', 'assurer:location'],
  headHummer: ['the_assurer_head_hummer', 'assurer:headHummer'],
  assuredThoughts: ['the_assurer_assured_thoughts', 'assurer:assuredThoughts'],
  wrapAnswers: ['the_assurer_end_of_day_wrap', 'assurer:endOfDayWrap'],
};

function hasStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function cleanText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function cleanUpper(value) {
  return cleanText(value).toUpperCase();
}

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function isPresent(value) {
  if (Array.isArray(value)) return value.some(isPresent);
  if (value && typeof value === 'object') return Object.values(value).some(isPresent);
  return cleanText(value).length > 0;
}


function formatDisplayDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
}

function dayOfWeek(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const difference = date - start + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  return Math.floor(difference / 86400000);
}

function normalizeDateKeys(dateKeys) {
  return Array.isArray(dateKeys) ? dateKeys.filter(Boolean) : [dateKeys].filter(Boolean);
}

function readStoredValue(baseKeys, dateKeys) {
  if (!hasStorage()) return '';
  const keys = Array.isArray(baseKeys) ? baseKeys : [baseKeys];
  const dates = normalizeDateKeys(dateKeys);
  for (const key of keys) {
    for (const dateKey of dates) {
      const dated = window.localStorage.getItem(`${key}:${dateKey}`);
      if (dated !== null && cleanText(dated)) return dated;
    }
    const undated = window.localStorage.getItem(key);
    if (undated !== null && cleanText(undated)) return undated;
  }
  return '';
}

function readStoredJson(baseKeys, dateKeys, fallback) {
  const raw = readStoredValue(baseKeys, dateKeys);
  return safeJsonParse(raw, fallback);
}

function readAssurerDayPayload(dateKeys) {
  return readStoredJson(ASSURER_DAY_STORAGE_KEY, dateKeys, null);
}

function readAssurerWord(dateKeys, assurerDayPayload = null) {
  const fallback = { word: '', definition: '' };
  const nativeWord = assurerDayPayload?.wordOfDay;
  if (nativeWord?.word || nativeWord?.definition) {
    return {
      word: cleanUpper(nativeWord.word),
      definition: cleanUpper(nativeWord.definition),
    };
  }
  const parsed = readStoredJson(ASSURER_WORD_STORAGE_KEY, dateKeys, fallback);
  if (parsed?.word || parsed?.definition) {
    return {
      word: cleanUpper(parsed.word),
      definition: cleanUpper(parsed.definition),
    };
  }
  return fallback;
}

function readAssurerNativeField(assurerDayPayload, fieldName, fallbackKeys, dateKeys, transform = cleanText) {
  const nativeValue = assurerDayPayload?.[fieldName];
  if (cleanText(nativeValue)) return transform(nativeValue);
  return transform(readStoredValue(fallbackKeys, dateKeys));
}

function normalizeWrapAnswers(value) {
  const parsed = typeof value === 'string' ? safeJsonParse(value, value) : value;
  if (Array.isArray(parsed)) {
    return parsed
      .map((answer, index) => ({
        id: cleanText(answer?.id || `wrap-${index + 1}`),
        question: cleanUpper(answer?.question || answer?.prompt),
        answer: cleanText(answer?.answer || answer?.value),
      }))
      .filter((answer) => answer.question || answer.answer);
  }
  if (parsed && typeof parsed === 'object') {
    return Object.entries(parsed)
      .map(([question, answer]) => ({ id: question, question: cleanUpper(question), answer: cleanText(answer) }))
      .filter((answer) => answer.question || answer.answer);
  }
  const text = cleanText(parsed);
  return text ? [{ id: 'wrap-note', question: 'END-OF-DAY WRAP', answer: text }] : [];
}

function macroHighlights(macroMirror) {
  const rows = Array.isArray(macroMirror?.rows) ? macroMirror.rows : [];
  return rows
    .filter((row) => isPresent(row?.currentDisplay) || isPresent(row?.leftDisplay))
    .map((row) => ({
      id: cleanText(row.key || row.label),
      label: cleanUpper(row.compactLabel || row.label),
      current: cleanUpper(row.currentDisplay),
      left: cleanUpper(row.leftDisplay),
      percent: Number.isFinite(Number(row.percent)) ? Math.round(Number(row.percent)) : null,
    }));
}

function mealHighlights(meals) {
  return (Array.isArray(meals) ? meals : [])
    .filter((meal) => isPresent(meal?.name) || isPresent(meal?.type) || isPresent(meal?.macroText))
    .slice(0, 6)
    .map((meal) => ({
      id: cleanText(meal.id),
      time: cleanUpper(meal.time),
      label: cleanUpper([meal.type, meal.name].filter(Boolean).join(' • ')),
      macroText: cleanUpper(meal.macroText),
      status: cleanUpper(meal.status || (meal.completed ? 'DONE' : '')),
    }));
}

function workoutHighlights(mirror) {
  if (!mirror?.hasData) return [];
  const rows = Array.isArray(mirror.exerciseRows) ? mirror.exerciseRows : [];
  return [
    cleanUpper(mirror.workout?.completed) && `TRAINING ${cleanUpper(mirror.workout.completed)}`,
    cleanUpper(mirror.workout?.duration) && `DURATION ${cleanUpper(mirror.workout.duration)}`,
    cleanUpper(mirror.cardio?.type) && `CARDIO ${cleanUpper([mirror.cardio.type, mirror.cardio.duration].filter(Boolean).join(' / '))}`,
    cleanUpper(mirror.recovery?.status) && `RECOVERY ${cleanUpper(mirror.recovery.status)}`,
    ...rows.slice(0, 4).map((row) => cleanUpper([row.exercise, row.sets && `${row.sets} SETS`, row.reps && `${row.reps} REPS`, row.weight && `${row.weight} LB`].filter(Boolean).join(' • '))),
  ].filter(Boolean);
}

function momentHighlights(momentMirror) {
  return REMEMBER_ME_MOMENT_TYPES
    .map((type) => {
      const moment = momentMirror?.[type.key];
      if (!moment) return null;
      return {
        id: moment.id,
        type: type.label,
        time: cleanUpper(moment.time),
        text: cleanText(moment.text || moment.description || moment.detail),
      };
    })
    .filter(Boolean);
}

function timelineHighlights(timeline) {
  return (Array.isArray(timeline?.entries) ? timeline.entries : [])
    .filter((entry) => isPresent(entry?.text) || isPresent(entry?.type))
    .slice(0, 8)
    .map((entry) => ({
      id: entry.id,
      time: cleanUpper(entry.time || 'ALL DAY'),
      type: cleanUpper(entry.type),
      text: cleanText(entry.text),
    }));
}

function weekSignal(weekMirror) {
  const days = Array.isArray(weekMirror?.weekDays) ? weekMirror.weekDays : [];
  const litDays = days.filter((day) => Array.isArray(day.entries) && day.entries.length);
  if (!litDays.length) return '';
  return `${litDays.length} THICC.TIME DAY${litDays.length === 1 ? '' : 'S'} LIT THIS WEEK`;
}

function weatherFromStorage(isoDate) {
  const parsed = readStoredJson(['the_assurer_weather', 'assurer:weather'], isoDate, null);
  if (!parsed || typeof parsed !== 'object') return null;
  const summary = [parsed.locationLabel || parsed.city || parsed.location, parsed.temperature && `${parsed.temperature}°`, parsed.condition].filter(Boolean).join(' • ');
  return cleanText(summary) ? { summary: cleanUpper(summary) } : null;
}

function phraseParts(dayPayload) {
  return [
    dayPayload.titleOfDay,
    dayPayload.wordOfDay?.word,
    dayPayload.mood,
    dayPayload.era,
    dayPayload.battleCry?.text,
    dayPayload.moments?.[0]?.text,
    dayPayload.assuredThoughts,
  ].map(cleanText).filter(Boolean);
}

function choose(parts, index, fallback) {
  return cleanUpper(parts[index % Math.max(parts.length, 1)] || fallback);
}

function makeSymbolSet(dayPayload) {
  const symbols = [];
  if (dayPayload.workoutHighlights.length) symbols.push('dumbbell comet', 'sweat lightning');
  if (dayPayload.mealHighlights.length) symbols.push('fork orbit', 'macro moon');
  if (dayPayload.moments.length) symbols.push('memory polaroids', 'plot spark');
  if (dayPayload.weather) symbols.push('weather cloud');
  if (dayPayload.weekSignal) symbols.push('week ladder');
  if (dayPayload.wordOfDay?.word) symbols.push('word ribbon');
  return symbols.length ? symbols : ['blank-page sigil', 'question curl'];
}

function buildFragments(dayPayload) {
  return [
    dayPayload.mood && `MOOD: ${dayPayload.mood}`,
    dayPayload.era && `ERA: ${dayPayload.era}`,
    dayPayload.singlenessLevel && `SINGLENESS: ${dayPayload.singlenessLevel}`,
    dayPayload.location && `LOCATION: ${dayPayload.location}`,
    dayPayload.headHummer && `HEAD HUMMER: ${dayPayload.headHummer}`,
    dayPayload.assuredThoughts && `ASSURED THOUGHTS: ${dayPayload.assuredThoughts}`,
    dayPayload.wordOfDay?.word && `WORD: ${dayPayload.wordOfDay.word}`,
    dayPayload.battleCry?.text && `BATTLE CRY: ${dayPayload.battleCry.text}`,
    ...dayPayload.workoutHighlights.slice(0, 4),
    ...dayPayload.mealHighlights.slice(0, 4).map((meal) => [meal.time, meal.label, meal.macroText].filter(Boolean).join(' — ')),
    ...dayPayload.macroHighlights.slice(0, 5).map((macro) => `${macro.label}: ${macro.current}${macro.percent !== null ? ` / ${macro.percent}%` : ''}`),
    dayPayload.weather?.summary,
    dayPayload.weekSignal,
    ...dayPayload.timelineHighlights.slice(0, 3).map((entry) => `${entry.time} ${entry.type}: ${entry.text}`),
    ...dayPayload.moments.map((moment) => `${moment.type}: ${moment.text}`),
    ...dayPayload.wrapAnswers.slice(0, 3).map((wrap) => `${wrap.question}: ${wrap.answer}`),
  ].map(cleanText).filter(Boolean);
}

function createVariation(dayPayload, index, config) {
  const parts = phraseParts(dayPayload);
  const fragments = buildFragments(dayPayload);
  const symbols = makeSymbolSet(dayPayload);

  return {
    id: `summation-variation-${index + 1}`,
    name: config.name,
    focalPhrase: choose(parts, index, config.fallbackPhrase),
    storyArc: config.storyArc,
    arrangement: config.arrangement,
    flowDirection: config.flowDirection,
    emotionalArc: config.emotionalArc,
    doodleHierarchy: [config.heroDoodle, ...symbols].slice(0, 6),
    wordRibbons: fragments.slice(index, index + 5).concat(fragments.slice(0, Math.max(0, 5 - fragments.slice(index, index + 5).length))),
    clusters: config.clusters.map((cluster, clusterIndex) => ({
      ...cluster,
      fragments: fragments.filter((_, fragmentIndex) => fragmentIndex % config.clusters.length === clusterIndex).slice(0, 4),
    })).filter((cluster) => cluster.fragments.length),
    sketchInstructions: [
      'stretch doodle lettering',
      'sketchnote arrows between every cluster',
      'looping connector lines',
      'tiny hand-drawn icons beside true source fragments only',
      config.instruction,
    ],
    sourceTruth: {
      sourceDate: dayPayload.sourceDate,
      chaoticaDayNumber: dayPayload.chaoticaDayNumber,
      fragmentCount: fragments.length,
    },
  };
}

export function generateSummationVariations(dayPayload) {
  const configs = [
    {
      name: 'RIBBON STORM MAP',
      fallbackPhrase: 'THE DAY MADE A LITTLE WEATHER',
      storyArc: 'center phrase blooms outward into weather, meals, movement, and memory sparks',
      arrangement: 'radial phrase sun with messy orbit ribbons',
      flowDirection: 'middle outward clockwise',
      emotionalArc: 'arrival → static → proof → exhale',
      heroDoodle: 'big stretched title ribbon',
      instruction: 'make the title wobble like it got caught in glamorous wind',
      clusters: [
        { label: 'THE ROOM', icon: 'pin + cloud' },
        { label: 'THE BODY', icon: 'dumbbell + fork' },
        { label: 'THE PLOT', icon: 'spark card' },
      ],
    },
    {
      name: 'LEFT-TO-RIGHT CHAOS PARADE',
      fallbackPhrase: 'ONE DAY, FIVE LITTLE DRAMAS',
      storyArc: 'morning-to-night sketchnote march with tiny flags for each signal',
      arrangement: 'horizontal parade lane with banner captions',
      flowDirection: 'left to right',
      emotionalArc: 'setup → appetite → effort → memory → closing question',
      heroDoodle: 'parade flag with Chaotica number',
      instruction: 'draw arrows like impatient marching bands',
      clusters: [
        { label: 'OPENING SCENE', icon: 'sun curl' },
        { label: 'SIGNALS', icon: 'signal sparks' },
        { label: 'END CAPTION', icon: 'moon note' },
      ],
    },
    {
      name: 'MOOD CONSTELLATION PAGE',
      fallbackPhrase: 'A CONSTELLATION OF SMALL PROOFS',
      storyArc: 'emotional star field where strongest source signals become doodle planets',
      arrangement: 'constellation web with dotted connectors',
      flowDirection: 'diagonal drift',
      emotionalArc: 'signal → shimmer → meaning',
      heroDoodle: 'mood moon with ribbon tail',
      instruction: 'use dotted loops and starbursts, never boxy cards',
      clusters: [
        { label: 'HEART WEATHER', icon: 'moon face' },
        { label: 'BODY ORBIT', icon: 'macro planets' },
        { label: 'MEMORY COMETS', icon: 'polaroid stars' },
      ],
    },
    {
      name: 'BATTLE CRY COMIC STRIP',
      fallbackPhrase: 'THE DAY FOUGHT BACK IN PANELS',
      storyArc: 'battle cry becomes a comic action line that every source fragment reacts to',
      arrangement: 'loose comic panels broken by scribble arrows',
      flowDirection: 'zig-zag down the page',
      emotionalArc: 'tension → punchline → rally',
      heroDoodle: 'speech bubble thunderbolt',
      instruction: 'make the battle cry a loud hand-lettered sound effect',
      clusters: [
        { label: 'CRY', icon: 'speech bolt' },
        { label: 'CLASH', icon: 'impact star' },
        { label: 'AFTERMATH', icon: 'soft landing cloud' },
      ],
    },
    {
      name: 'ARCHIVE ALTAR SKETCH',
      fallbackPhrase: 'THIS IS WHAT THE DAY LEFT BEHIND',
      storyArc: 'a final altar of truthful fragments, ready for Hopewood chronology',
      arrangement: 'stacked shrine shelves with ribbons and tiny relic icons',
      flowDirection: 'top to bottom',
      emotionalArc: 'gather → name → seal',
      heroDoodle: 'wax seal with tiny crown',
      instruction: 'draw the final seal as a doodled stamp, not a corporate badge',
      clusters: [
        { label: 'NAMED', icon: 'label ribbon' },
        { label: 'WITNESSED', icon: 'eye sparkle' },
        { label: 'SEALED', icon: 'wax stamp' },
      ],
    },
  ];

  return configs.map((config, index) => createVariation(dayPayload, index, config));
}

export async function readAssurerDayForSummation(date = new Date()) {
  const sourceDate = getLocalDateKey(date);
  const sourceDateCandidates = getDailyDateKeyCandidates(date);
  const displayDate = formatDisplayDate(date);
  const daEaterDate = getDaEaterStorageDate(date);
  const rememberMeMomentDate = getRememberMeMomentDateKey(date);
  const rememberMeTimelineDate = getRememberMeDayTimelineDateKey(date);
  const assurerDayPayload = readAssurerDayPayload(sourceDateCandidates);
  const titleOfDay = readAssurerNativeField(assurerDayPayload, 'titleOfDay', ASSURER_TITLE_STORAGE_KEY, sourceDateCandidates);
  const wordOfDay = readAssurerWord(sourceDateCandidates, assurerDayPayload);
  const dailyBattleCry = getBattleCryForDate(date);

  const [rememberMeDayTimeline, thiccTimeWeekMirror] = await Promise.all([
    readRememberMeDayTimelineMirror(rememberMeTimelineDate).catch(() => ({ ...EMPTY_REMEMBER_ME_DAY_TIMELINE, dateKey: rememberMeTimelineDate })),
    readThiccTimeWeekMirror(date).catch(() => ({ ...EMPTY_THICC_TIME_WEEK_MIRROR, weekDays: getThiccTimeWeekDays(date) })),
  ]);

  const macroMirror = readDaEaterMacroMirror(daEaterDate) || ASSURER_MACRO_FALLBACK_MIRROR;
  const daEaterMeals = readDaEaterMealLogForDate(daEaterDate) || EMPTY_DA_EATER_MEAL_LOG;
  const rememberMeMomentMirror = readRememberMeMomentMirror(rememberMeMomentDate) || EMPTY_REMEMBER_ME_MOMENT_MIRROR;
  const thiccFittWorkoutMirror = readThiccFittWorkoutMirror(sourceDateCandidates) || EMPTY_THICC_FITT_WORKOUT_MIRROR;
  const wrapAnswers = normalizeWrapAnswers(readStoredValue(ASSURER_DAILY_FIELD_KEYS.wrapAnswers, sourceDateCandidates));

  return {
    source: 'THE.ASSURER',
    sourceDate,
    displayDate,
    dayOfWeek: dayOfWeek(date),
    chaoticaDayNumber: dayOfYear(date),
    titleOfDay,
    mood: readAssurerNativeField(assurerDayPayload, 'mood', ASSURER_DAILY_FIELD_KEYS.mood, sourceDateCandidates, cleanUpper),
    era: readAssurerNativeField(assurerDayPayload, 'era', ASSURER_DAILY_FIELD_KEYS.era, sourceDateCandidates, cleanUpper),
    singlenessLevel: readAssurerNativeField(assurerDayPayload, 'singlenessLevel', ASSURER_DAILY_FIELD_KEYS.singlenessLevel, sourceDateCandidates, cleanUpper),
    location: readAssurerNativeField(assurerDayPayload, 'location', ASSURER_DAILY_FIELD_KEYS.location, sourceDateCandidates, cleanUpper),
    headHummer: readAssurerNativeField(assurerDayPayload, 'headHummer', ASSURER_DAILY_FIELD_KEYS.headHummer, sourceDateCandidates, cleanUpper),
    wordOfDay,
    assuredThoughts: readAssurerNativeField(assurerDayPayload, 'assuredThoughts', ASSURER_DAILY_FIELD_KEYS.assuredThoughts, sourceDateCandidates),
    battleCry: {
      text: cleanText(dailyBattleCry?.text),
      attribution: cleanText(dailyBattleCry?.attribution),
      category: cleanText(dailyBattleCry?.category),
    },
    macroHighlights: macroHighlights(macroMirror),
    mealHighlights: mealHighlights(daEaterMeals),
    workoutHighlights: workoutHighlights(thiccFittWorkoutMirror),
    weather: weatherFromStorage(sourceDateCandidates),
    weekSignal: weekSignal(thiccTimeWeekMirror),
    timelineHighlights: timelineHighlights(rememberMeDayTimeline),
    moments: momentHighlights(rememberMeMomentMirror),
    wrapAnswers,
    sourceAvailability: {
      title: Boolean(titleOfDay),
      word: Boolean(wordOfDay.word),
      mood: Boolean(readAssurerNativeField(assurerDayPayload, 'mood', ASSURER_DAILY_FIELD_KEYS.mood, sourceDateCandidates, cleanUpper)),
      era: Boolean(readAssurerNativeField(assurerDayPayload, 'era', ASSURER_DAILY_FIELD_KEYS.era, sourceDateCandidates, cleanUpper)),
      singlenessLevel: Boolean(readAssurerNativeField(assurerDayPayload, 'singlenessLevel', ASSURER_DAILY_FIELD_KEYS.singlenessLevel, sourceDateCandidates, cleanUpper)),
      location: Boolean(readAssurerNativeField(assurerDayPayload, 'location', ASSURER_DAILY_FIELD_KEYS.location, sourceDateCandidates, cleanUpper)),
      headHummer: Boolean(readAssurerNativeField(assurerDayPayload, 'headHummer', ASSURER_DAILY_FIELD_KEYS.headHummer, sourceDateCandidates, cleanUpper)),
      assuredThoughts: Boolean(readAssurerNativeField(assurerDayPayload, 'assuredThoughts', ASSURER_DAILY_FIELD_KEYS.assuredThoughts, sourceDateCandidates)),
      macroSnapshot: Boolean(macroHighlights(macroMirror).length),
      mealLog: Boolean(mealHighlights(daEaterMeals).length),
      thiccFitt: Boolean(workoutHighlights(thiccFittWorkoutMirror).length),
      rememberMeEvents: Boolean(timelineHighlights(rememberMeDayTimeline).length),
      momentCards: Boolean(momentHighlights(rememberMeMomentMirror).length),
      thiccTimeWeek: Boolean(weekSignal(thiccTimeWeekMirror)),
      wrapAnswers: Boolean(wrapAnswers.length),
    },
  };
}

function readSealedRecords() {
  if (!hasStorage()) return [];
  const parsed = safeJsonParse(window.localStorage.getItem(SUMMATION_SEALED_STORAGE_KEY), []);
  return Array.isArray(parsed) ? parsed : [];
}

export function sealSummationVariation(dayPayload, selectedVariation) {
  if (!hasStorage() || !dayPayload?.sourceDate || !selectedVariation?.id) return null;

  const sealedRecord = {
    id: `summation-${dayPayload.sourceDate}`,
    source: 'THE.SUMMATION',
    sourceDate: dayPayload.sourceDate,
    displayDate: dayPayload.displayDate,
    dayOfWeek: dayPayload.dayOfWeek,
    chaoticaDayNumber: dayPayload.chaoticaDayNumber,
    selectedVariationId: selectedVariation.id,
    selectedVariationName: selectedVariation.name,
    renderedStoryPayload: selectedVariation,
    sourceTruthSnapshot: dayPayload,
    sealedAt: new Date().toISOString(),
  };

  const records = readSealedRecords().filter((record) => String(record?.sourceDate || '') !== String(dayPayload.sourceDate));
  window.localStorage.setItem(SUMMATION_SEALED_STORAGE_KEY, JSON.stringify([...records, sealedRecord]));
  receiveSealedSummation(sealedRecord);
  return sealedRecord;
}
