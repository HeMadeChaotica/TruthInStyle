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

const ASSURER_TITLE_STORAGE_KEY = ['the_assurer_title_of_day', 'assurer:titleOfDay', 'assurer:title'];
const ASSURER_WORD_STORAGE_KEY = ['the_assurer_word_of_day', 'assurer:wordOfDay', 'assurer:dailyWord'];
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
  dateKey: ['the_assurer_date_key', 'assurer:dateKey'],
  dayOfWeek: ['the_assurer_day_of_week', 'assurer:dayOfWeek'],
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
  const nativeWord = assurerDayPayload?.wordOfDay || assurerDayPayload?.dailyWord;
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

function readPayloadField(assurerDayPayload, fieldNames) {
  const names = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
  for (const fieldName of names) {
    const nativeValue = assurerDayPayload?.[fieldName];
    if (cleanText(nativeValue)) return nativeValue;
  }
  return '';
}

function readAssurerNativeField(assurerDayPayload, fieldName, fallbackKeys, dateKeys, transform = cleanText) {
  const nativeValue = readPayloadField(assurerDayPayload, fieldName);
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

function firstPresent(...values) {
  return values.map(cleanText).find(Boolean) || '';
}

function truncateText(value, maxLength = 96) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function mergeWrapAnswers(storedAnswers = [], liveAnswers = {}) {
  const live = Object.entries(liveAnswers || {})
    .map(([question, answer]) => ({ id: question, question: cleanUpper(question), answer: cleanText(answer) }))
    .filter((answer) => answer.answer);
  return [...live, ...(Array.isArray(storedAnswers) ? storedAnswers : [])]
    .filter((answer, index, all) => answer.answer && all.findIndex((candidate) => candidate.id === answer.id && candidate.answer === answer.answer) === index);
}

function wrapAnswerById(wrapAnswers, ids) {
  const wanted = Array.isArray(ids) ? ids : [ids];
  return firstPresent(...wanted.map((id) => wrapAnswers.find((answer) => answer.id === id || answer.question.toLowerCase().includes(id))?.answer));
}

function momentByType(dayPayload, label) {
  return (dayPayload.moments || []).find((moment) => cleanText(moment.type).toLowerCase().includes(label.toLowerCase()))?.text || '';
}

function momentText(dayPayload, index = 0) {
  return cleanText((dayPayload.moments || [])[index]?.text);
}

function mealText(dayPayload, index = 0) {
  const meal = (dayPayload.mealHighlights || [])[index];
  return meal ? [meal.time, meal.label, meal.macroText].filter(Boolean).join(' · ') : '';
}

function macroText(dayPayload, index = 0) {
  const macro = (dayPayload.macroHighlights || [])[index];
  return macro ? [macro.label, macro.current, macro.left && `${macro.left} LEFT`, macro.percent !== null ? `${macro.percent}%` : ''].filter(Boolean).join(' · ') : '';
}

function timelineText(dayPayload, index = 0) {
  const entry = (dayPayload.timelineHighlights || [])[index];
  return entry ? [entry.time, entry.text || entry.type].filter(Boolean).join(' · ') : '';
}

function makeTextItem(source, value, options = {}) {
  const text = truncateText(value, options.maxLength || 112);
  const sourceKey = cleanText(options.sourceKey);
  return text && sourceKey ? { source, sourceKey, text, role: options.role || 'line' } : null;
}

function makeVisualItem(source, value, form, sourceKey = 'otherAssurerSource') {
  const text = truncateText(value, 92);
  return text ? { source, sourceKey, text, form } : null;
}

function makeFocalItem(source, value, sourceKey) {
  const text = truncateText(value, 88);
  return text && sourceKey ? { source, sourceKey, text } : null;
}

function firstFocalItem(...items) {
  return items.find((item) => item?.text) || null;
}

function compactItems(items, limit = 6) {
  return items.filter(Boolean).slice(0, limit);
}

function sourceAvailabilityCount(dayPayload) {
  return Object.values(dayPayload.sourceAvailability || {}).filter(Boolean).length;
}

function identityLine(dayPayload) {
  return [
    cleanText(dayPayload.titleOfDay),
    dayPayload.displayDate,
    dayPayload.dayOfWeek,
    `Chaotica Day # ${dayPayload.chaoticaDayNumber || getChaoticaDayNumber(dayPayload.sourceDate)}`,
  ].filter(Boolean).join(' · ');
}

export const SUMMATION_REMIX_PRESETS = [
  {
    id: 'variation-1',
    selectorLabel: 'Variation 1',
    name: 'THE MASQUERADE MAP',
    visualFocus: 'The day becomes a ballroom map of emotional motion.',
    textSources: ['Title of the Day', 'Date', 'Day of Week', 'Chaotica Day #', 'Word of the Day', 'Assured Thoughts excerpt'],
    drawingSources: ['Mood mask illustration', 'Era costume/posture cue', 'Singleness heart-orbit', 'WOW/WTF/PLOT TWIST masquerade scene doodles'],
    animatedSources: ['Battle Cry moving ribbon', 'Head Hummer pulsing music-note glyphs'],
    smallIconSources: ['Singleness Level', 'Word of the Day', 'Moment cards'],
    backgroundTextureSources: ['Weather atmospheric marks', 'Location atmospheric marks'],
    emotionalArc: 'arrival → masked feeling → small scenes → ribboned resolve',
    layoutBehavior: 'Ballroom-map orbit with mood and moment doodles arranged around the sourced title.',
  },
  {
    id: 'variation-2',
    selectorLabel: 'Variation 2',
    name: 'THE BODY PULSE FLOOR',
    visualFocus: 'The day is told through body, effort, appetite, and energy.',
    textSources: ['Title of the Day', 'Word of the Day', 'Battle Cry excerpt', 'Assured Thoughts excerpt'],
    drawingSources: ['THICC.FITT movement doodles', 'Macro plate/fuel symbols', 'Meal Log food glyphs', 'Sleep/recovery body marks'],
    animatedSources: ['Workout energy line', 'Macro/fuel pulse line', 'Cardio or movement orbit'],
    smallIconSources: ['Meal Log highlights', 'Macro snapshot', 'Recovery signal'],
    backgroundTextureSources: ['Remember.Me timestamp flecks'],
    emotionalArc: 'body signal → appetite evidence → effort pulse → grounded truth',
    layoutBehavior: 'Floor-plan pulse path with body/fuel drawings carrying the story across one board.',
  },
  {
    id: 'variation-3',
    selectorLabel: 'Variation 3',
    name: 'THE THREE-ACT DRAMA',
    visualFocus: 'The day becomes a stage story with beginning, turn, and closing truth.',
    textSources: ['Title of the Day', 'Date / Day / Chaotica Day #', 'What defined today?', 'What truth are you sealing?'],
    drawingSources: ['WOW Act I sketch', 'WTF Act II sketch', 'PLOT TWIST Act III sketch', 'Mood theater mask pair'],
    animatedSources: ['Act-divider line', 'Final truth reveal shimmer'],
    smallIconSources: ['Meal symbol', 'Workout symbol', 'Weather symbol'],
    backgroundTextureSources: ['Meal, workout, and weather supporting symbols'],
    emotionalArc: 'opening mask → turn of the room → sealed closing truth',
    layoutBehavior: 'Three theatrical act zones share one stage without becoming separate boards.',
  },
  {
    id: 'variation-4',
    selectorLabel: 'Variation 4',
    name: 'THE WORD FLOOD',
    visualFocus: 'The wording of the day becomes the dominant art.',
    textSources: ['Title of the Day', 'Word of the Day', 'Assured Thoughts', 'wrap-question answers'],
    drawingSources: ['Source-signal orbit doodles', 'Event calendar sparks', 'THICC.FITT motion marks', 'DA.EATER fuel marks'],
    animatedSources: ['Flowing underline strokes', 'Slow orbit lines around the strongest phrase'],
    smallIconSources: ['Events', 'Workout', 'Food', 'Weather'],
    backgroundTextureSources: ['Battle Cry faint supporting script'],
    emotionalArc: 'named word → thought flood → answer current → quiet underline',
    layoutBehavior: 'Large language field with small doodles orbiting the strongest sourced phrase.',
  },
  {
    id: 'variation-5',
    selectorLabel: 'Variation 5',
    name: 'THE ORACLE COLLAGE',
    visualFocus: 'The day becomes a symbolic oracle board.',
    textSources: ['Title of the Day', 'Date / Day / Chaotica Day #', 'final sealed truth', 'future-me reminder'],
    drawingSources: ['Mood oracle symbol', 'Era emblem', 'Singleness relational icon', 'Word central sigil', 'WOW/WTF/PLOT TWIST omen cards'],
    animatedSources: ['Opal glints on central sigil', 'Slow line movement between symbols'],
    smallIconSources: ['Mood', 'Era', 'Singleness', 'Word of the Day'],
    backgroundTextureSources: ['Workout fragments', 'Food fragments', 'Event fragments', 'Weather fragments'],
    emotionalArc: 'symbols gather → sigil names it → future reminder seals it',
    layoutBehavior: 'Oracle collage with one central sigil and connected omen fragments.',
  },
];

export function getSummationRemixPresets() {
  return SUMMATION_REMIX_PRESETS;
}

function buildPresetRemix(dayPayload, preset, wrapAnswers) {
  const title = cleanText(dayPayload.titleOfDay);
  const titleItem = makeTextItem('Title of the Day', title, { sourceKey: 'titleOfDay', role: 'title', maxLength: 88 });
  const wordItem = makeTextItem('Word of the Day', dayPayload.wordOfDay?.word, { sourceKey: 'wordOfDay', role: 'word', maxLength: 48 });
  const assuredExcerpt = makeTextItem('Assured Thoughts', dayPayload.assuredThoughts, { sourceKey: 'assuredThoughts', role: 'thought', maxLength: 120 });
  const battleExcerpt = makeTextItem('Battle Cry', dayPayload.battleCry?.text, { sourceKey: 'battleCry', role: 'cry', maxLength: 94 });
  const dateItem = makeTextItem('Date / Day / Chaotica', identityLine(dayPayload), { sourceKey: 'otherAssurerSource', role: 'identity', maxLength: 120 });
  const definedAnswer = makeTextItem('What defined today?', wrapAnswerById(wrapAnswers, 'defined'), { sourceKey: 'wrapAnswers', role: 'wrap', maxLength: 100 });
  const truthAnswer = makeTextItem('What truth are you sealing?', wrapAnswerById(wrapAnswers, ['truth', 'sealing']), { sourceKey: 'wrapAnswers', role: 'truth', maxLength: 100 });
  const futureAnswer = makeTextItem('Future-me reminder', wrapAnswerById(wrapAnswers, ['remember', 'future']), { sourceKey: 'wrapAnswers', role: 'future', maxLength: 100 });
  const wrapTextItems = wrapAnswers.map((answer) => makeTextItem(answer.question || 'Wrap answer', answer.answer, { sourceKey: 'wrapAnswers', role: 'wrap', maxLength: 100 }));

  const wow = momentByType(dayPayload, 'wow') || momentText(dayPayload, 0);
  const wtf = momentByType(dayPayload, 'wtf') || momentText(dayPayload, 1);
  const plotTwist = momentByType(dayPayload, 'plot') || momentText(dayPayload, 2);
  const workout = firstPresent(...(dayPayload.workoutHighlights || []));
  const cardio = (dayPayload.workoutHighlights || []).find((item) => item.includes('CARDIO')) || workout;
  const recovery = (dayPayload.workoutHighlights || []).find((item) => item.includes('RECOVERY')) || '';
  const food = mealText(dayPayload, 0);
  const macro = macroText(dayPayload, 0);
  const weather = dayPayload.weather?.summary;
  const location = dayPayload.location;
  const timeline = timelineText(dayPayload, 0);
  const storedTruthAnswer = makeTextItem('Final sealed truth', wrapAnswerById(dayPayload.wrapAnswers || [], ['truth', 'sealing']), { sourceKey: 'wrapAnswers', role: 'truth' });
  const assuredTruth = makeTextItem('Final sealed truth', dayPayload.assuredThoughts, { sourceKey: 'assuredThoughts', role: 'truth' });
  const finalTruth = truthAnswer || storedTruthAnswer || assuredTruth;

  const byPreset = {
    'variation-1': {
      text: compactItems([titleItem, dateItem, wordItem, assuredExcerpt], 4),
      drawings: compactItems([
        makeVisualItem('Mood', dayPayload.mood, 'mask illustration'),
        makeVisualItem('Era', dayPayload.era, 'costume posture cue'),
        makeVisualItem('Singleness Level', dayPayload.singlenessLevel, 'heart-orbit symbol'),
        makeVisualItem('WOW moment', wow, 'tiny masquerade scene', 'moments'),
        makeVisualItem('WTF moment', wtf, 'tiny masquerade scene', 'moments'),
        makeVisualItem('PLOT TWIST moment', plotTwist, 'tiny masquerade scene', 'moments'),
      ], 6),
      animated: compactItems([
        makeVisualItem('Battle Cry', dayPayload.battleCry?.text, 'subtle moving ribbon', 'battleCry'),
        makeVisualItem('Head Hummer', dayPayload.headHummer, 'pulsing music-note glyphs'),
      ], 3),
      icons: compactItems([
        makeVisualItem('Word of the Day', dayPayload.wordOfDay?.word, 'word pin', 'wordOfDay'),
        makeVisualItem('Singleness Level', dayPayload.singlenessLevel, 'heart orbit'),
        makeVisualItem('Chaotica Day #', dayPayload.chaoticaDayNumber, 'number charm'),
      ], 4),
      texture: compactItems([
        makeVisualItem('Weather', weather, 'atmospheric marks'),
        makeVisualItem('Location', location, 'room haze'),
      ], 4),
      focal: firstFocalItem(
        makeFocalItem('Title of the Day', title, 'titleOfDay'),
        makeFocalItem('Word of the Day', dayPayload.wordOfDay?.word, 'wordOfDay'),
      ),
    },
    'variation-2': {
      text: compactItems([titleItem, wordItem, battleExcerpt, assuredExcerpt], 4),
      drawings: compactItems([
        makeVisualItem('THICC.FITT', workout, 'movement doodles'),
        makeVisualItem('Macro snapshot', macro, 'abstract plate / fuel symbols'),
        makeVisualItem('Meal Log', food, 'tiny food glyphs'),
        makeVisualItem('Recovery signal', recovery, 'body-energy marks'),
      ], 5),
      animated: compactItems([
        makeVisualItem('Workout energy', workout, 'energy line'),
        makeVisualItem('Macro fuel', macro, 'fuel pulse line'),
        makeVisualItem('Cardio movement', cardio, 'movement orbit'),
      ], 3),
      icons: compactItems([
        makeVisualItem('Meal Log', mealText(dayPayload, 1) || food, 'food glyph'),
        makeVisualItem('Macro snapshot', macroText(dayPayload, 1) || macro, 'fuel dot'),
        makeVisualItem('Recovery signal', recovery, 'rest crescent'),
      ], 4),
      texture: compactItems((dayPayload.timelineHighlights || []).slice(0, 5).map((entry) => makeVisualItem('Remember.Me event', [entry.time, entry.text || entry.type].filter(Boolean).join(' · '), 'timestamp fleck', 'moments')), 5),
      focal: firstFocalItem(
        makeFocalItem('Word of the Day', dayPayload.wordOfDay?.word, 'wordOfDay'),
        makeFocalItem('Title of the Day', title, 'titleOfDay'),
        makeFocalItem('Battle Cry', dayPayload.battleCry?.text, 'battleCry'),
        makeFocalItem('Assured Thoughts', dayPayload.assuredThoughts, 'assuredThoughts'),
      ),
    },
    'variation-3': {
      text: compactItems([titleItem, dateItem, definedAnswer, finalTruth], 4),
      drawings: compactItems([
        makeVisualItem('WOW', wow, 'Act I sketch', 'moments'),
        makeVisualItem('WTF', wtf, 'Act II sketch', 'moments'),
        makeVisualItem('PLOT TWIST', plotTwist, 'Act III sketch', 'moments'),
        makeVisualItem('Mood', dayPayload.mood, 'theater mask pair'),
      ], 4),
      animated: compactItems([
        makeVisualItem('Act divider', firstPresent(wow, wtf, plotTwist), 'slow act-divider line'),
        finalTruth && makeVisualItem('Final truth', finalTruth.text, 'reveal shimmer', finalTruth.sourceKey),
      ], 3),
      icons: compactItems([
        makeVisualItem('Meal', food, 'supporting plate'),
        makeVisualItem('Workout', workout, 'supporting motion mark'),
        makeVisualItem('Weather', weather, 'supporting cloud'),
      ], 4),
      texture: compactItems([
        makeVisualItem('Meal', food, 'stage prop fleck'),
        makeVisualItem('Workout', workout, 'stage prop fleck'),
        makeVisualItem('Weather', weather, 'stage atmosphere'),
      ], 4),
      focal: firstFocalItem(
        finalTruth && makeFocalItem(finalTruth.source, finalTruth.text, finalTruth.sourceKey),
        makeFocalItem('Title of the Day', title, 'titleOfDay'),
        definedAnswer && makeFocalItem(definedAnswer.source, definedAnswer.text, definedAnswer.sourceKey),
      ),
    },
    'variation-4': {
      text: compactItems([titleItem, wordItem, assuredExcerpt, ...wrapTextItems], 7),
      drawings: compactItems([
        makeVisualItem('Source signals', firstPresent(dayPayload.mood, dayPayload.era, weather), 'orbit doodles'),
        makeVisualItem('Events', timeline, 'calendar sparks'),
        makeVisualItem('THICC.FITT', workout, 'motion marks'),
        makeVisualItem('DA.EATER', food || macro, 'fuel marks'),
      ], 5),
      animated: compactItems([
        makeVisualItem('Strong phrase', firstPresent(dayPayload.wordOfDay?.word, dayPayload.assuredThoughts, title), 'flowing underline strokes', firstPresent(dayPayload.wordOfDay?.word) ? 'wordOfDay' : firstPresent(dayPayload.assuredThoughts) ? 'assuredThoughts' : 'titleOfDay'),
        makeVisualItem('Strong phrase orbit', firstPresent(dayPayload.assuredThoughts, dayPayload.wordOfDay?.word, title), 'slow orbit lines', firstPresent(dayPayload.assuredThoughts) ? 'assuredThoughts' : firstPresent(dayPayload.wordOfDay?.word) ? 'wordOfDay' : 'titleOfDay'),
      ], 3),
      icons: compactItems([
        makeVisualItem('Events', timeline, 'calendar spark'),
        makeVisualItem('Workout', workout, 'motion mark'),
        makeVisualItem('Food', food, 'fuel mark'),
        makeVisualItem('Weather', weather, 'tiny cloud'),
      ], 5),
      texture: compactItems([
        makeVisualItem('Battle Cry', dayPayload.battleCry?.text, 'faint supporting script', 'battleCry'),
      ], 2),
      focal: firstFocalItem(
        makeFocalItem('Word of the Day', dayPayload.wordOfDay?.word, 'wordOfDay'),
        makeFocalItem('Title of the Day', title, 'titleOfDay'),
        makeFocalItem('Assured Thoughts', dayPayload.assuredThoughts, 'assuredThoughts'),
      ),
    },
    'variation-5': {
      text: compactItems([titleItem, dateItem, finalTruth, futureAnswer], 4),
      drawings: compactItems([
        makeVisualItem('Mood', dayPayload.mood, 'oracle symbol'),
        makeVisualItem('Era', dayPayload.era, 'symbolic emblem'),
        makeVisualItem('Singleness', dayPayload.singlenessLevel, 'relational icon'),
        makeVisualItem('Word of the Day', dayPayload.wordOfDay?.word, 'central sigil', 'wordOfDay'),
        makeVisualItem('WOW', wow, 'omen card'),
        makeVisualItem('WTF', wtf, 'omen card'),
        makeVisualItem('PLOT TWIST', plotTwist, 'omen card'),
      ], 7),
      animated: compactItems([
        makeVisualItem('Word sigil', dayPayload.wordOfDay?.word, 'opal glints', 'wordOfDay'),
        makeVisualItem('Symbol relationships', firstPresent(dayPayload.mood, dayPayload.era, dayPayload.singlenessLevel), 'slow line movement'),
      ], 3),
      icons: compactItems([
        makeVisualItem('Mood', dayPayload.mood, 'oracle mark'),
        makeVisualItem('Era', dayPayload.era, 'emblem mark'),
        makeVisualItem('Singleness', dayPayload.singlenessLevel, 'relation mark'),
        makeVisualItem('Word', dayPayload.wordOfDay?.word, 'sigil mark', 'wordOfDay'),
      ], 5),
      texture: compactItems([
        makeVisualItem('Workout', workout, 'collage fragment'),
        makeVisualItem('Food', food, 'collage fragment'),
        makeVisualItem('Events', timeline, 'collage fragment'),
        makeVisualItem('Weather', weather, 'collage fragment'),
      ], 5),
      focal: firstFocalItem(
        makeFocalItem('Word of the Day', dayPayload.wordOfDay?.word, 'wordOfDay'),
        finalTruth && makeFocalItem(finalTruth.source, finalTruth.text, finalTruth.sourceKey),
        makeFocalItem('Title of the Day', title, 'titleOfDay'),
      ),
    },
  };

  const remix = byPreset[preset.id] || byPreset['variation-1'];
  const storyFragments = [
    ...remix.text.map((item) => item.text),
    ...remix.drawings.map((item) => `${item.text} as ${item.form}`),
    ...remix.animated.map((item) => `${item.text} in motion`),
    ...remix.texture.map((item) => item.text),
  ].filter(Boolean);

  return {
    ...preset,
    variationId: preset.id,
    presetName: preset.name,
    title,
    hasAssurerTitle: Boolean(title),
    emptyTitleText: 'Title of the Day is empty in THE.ASSURER.',
    displayDate: dayPayload.displayDate || formatDisplayDate(new Date()),
    dayOfWeek: dayPayload.dayOfWeek || dayOfWeek(new Date()),
    chaoticaDayNumber: dayPayload.chaoticaDayNumber || getChaoticaDayNumber(dayPayload.sourceDate),
    focalPhrase: cleanUpper(remix.focal?.text || ''),
    focalSource: remix.focal ? { source: remix.focal.source, sourceKey: remix.focal.sourceKey } : null,
    textItems: remix.text.filter((item) => item?.sourceKey),
    drawingItems: remix.drawings,
    animatedItems: remix.animated,
    iconItems: remix.icons,
    textureItems: remix.texture,
    storyFragments: storyFragments.slice(0, 9),
    sourceMap: {
      text: preset.textSources,
      drawing: preset.drawingSources,
      animated: preset.animatedSources,
      smallIcon: preset.smallIconSources,
      backgroundTexture: preset.backgroundTextureSources,
      title: titleItem ? { source: titleItem.source, sourceKey: titleItem.sourceKey, text: titleItem.text } : null,
      emotionalFocalPoint: remix.focal ? { source: remix.focal.source, sourceKey: remix.focal.sourceKey, text: remix.focal.text } : null,
    },
    sourceTruth: {
      source: dayPayload.source || 'THE.ASSURER',
      sourceDate: dayPayload.sourceDate,
      availableSignals: sourceAvailabilityCount(dayPayload),
    },
  };
}

export async function readAssurerDayForSummation(date = new Date()) {
  const sourceDate = getLocalDateKey(date);
  const sourceDateCandidates = getDailyDateKeyCandidates(date);
  const displayDate = formatDisplayDate(date);
  const daEaterDate = getDaEaterStorageDate(date);
  const rememberMeMomentDate = getRememberMeMomentDateKey(date);
  const rememberMeTimelineDate = getRememberMeDayTimelineDateKey(date);
  const assurerDayPayload = readAssurerDayPayload(sourceDateCandidates);
  const titleOfDay = readAssurerNativeField(assurerDayPayload, ['titleOfDay', 'title', 'dailyTitle'], ASSURER_TITLE_STORAGE_KEY, sourceDateCandidates);
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
    dateKey: readAssurerNativeField(assurerDayPayload, 'dateKey', ASSURER_DAILY_FIELD_KEYS.dateKey, sourceDateCandidates) || sourceDate,
    dayOfWeek: readAssurerNativeField(assurerDayPayload, 'dayOfWeek', ASSURER_DAILY_FIELD_KEYS.dayOfWeek, sourceDateCandidates, cleanUpper) || dayOfWeek(date),
    chaoticaDayNumber: getChaoticaDayNumber(sourceDate),
    titleOfDay,
    mood: readAssurerNativeField(assurerDayPayload, 'mood', ASSURER_DAILY_FIELD_KEYS.mood, sourceDateCandidates, cleanUpper),
    era: readAssurerNativeField(assurerDayPayload, 'era', ASSURER_DAILY_FIELD_KEYS.era, sourceDateCandidates, cleanUpper),
    singlenessLevel: readAssurerNativeField(assurerDayPayload, ['singlenessLevel', 'singleness', 'singleLevel'], ASSURER_DAILY_FIELD_KEYS.singlenessLevel, sourceDateCandidates, cleanUpper),
    location: readAssurerNativeField(assurerDayPayload, 'location', ASSURER_DAILY_FIELD_KEYS.location, sourceDateCandidates, cleanUpper),
    headHummer: readAssurerNativeField(assurerDayPayload, ['headHummer', 'headHum', 'songLoop'], ASSURER_DAILY_FIELD_KEYS.headHummer, sourceDateCandidates, cleanUpper),
    wordOfDay,
    assuredThoughts: readAssurerNativeField(assurerDayPayload, ['assuredThoughts', 'thoughts', 'assurerThoughts'], ASSURER_DAILY_FIELD_KEYS.assuredThoughts, sourceDateCandidates),
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
      singlenessLevel: Boolean(readAssurerNativeField(assurerDayPayload, ['singlenessLevel', 'singleness', 'singleLevel'], ASSURER_DAILY_FIELD_KEYS.singlenessLevel, sourceDateCandidates, cleanUpper)),
      location: Boolean(readAssurerNativeField(assurerDayPayload, 'location', ASSURER_DAILY_FIELD_KEYS.location, sourceDateCandidates, cleanUpper)),
      headHummer: Boolean(readAssurerNativeField(assurerDayPayload, ['headHummer', 'headHum', 'songLoop'], ASSURER_DAILY_FIELD_KEYS.headHummer, sourceDateCandidates, cleanUpper)),
      assuredThoughts: Boolean(readAssurerNativeField(assurerDayPayload, ['assuredThoughts', 'thoughts', 'assurerThoughts'], ASSURER_DAILY_FIELD_KEYS.assuredThoughts, sourceDateCandidates)),
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

export function getChaoticaDayNumber(dateKey = getLocalDateKey(new Date())) {
  const requestedDateKey = cleanText(dateKey);
  const records = readSealedRecords();
  const existing = records.find((record) => cleanText(record?.sourceDate) === requestedDateKey || cleanText(record?.dateKey) === requestedDateKey);
  if (existing?.chaoticaDayNumber) return Number(existing.chaoticaDayNumber);
  return records.length + 1;
}

export function generateSummationVariations(dayPayload = null, wrapAnswers = {}) {
  const payload = dayPayload || {};
  const mergedWrapAnswers = mergeWrapAnswers(payload.wrapAnswers, wrapAnswers);
  return SUMMATION_REMIX_PRESETS.map((preset) => buildPresetRemix(payload, preset, mergedWrapAnswers));
}

export function generateSummationSketchStory(dayPayload = null, selectedVariation = 'Variation 1', wrapAnswers = {}) {
  const variations = generateSummationVariations(dayPayload, wrapAnswers);
  const selectedNumber = Number(cleanText(selectedVariation).match(/\d+/)?.[0] || 1);
  return variations[selectedNumber - 1] || variations[0];
}

export function buildSummationSealPayload(selectedVariation, wrapAnswers = {}) {
  if (!selectedVariation) return null;
  return {
    ...selectedVariation,
    variationId: selectedVariation.variationId || selectedVariation.id,
    presetName: selectedVariation.presetName || selectedVariation.name,
    wrapAnswers,
  };
}

export function sealSummationVariation(dayPayload, selectedVariation) {
  const directVariationId = selectedVariation?.variationId || selectedVariation?.id;
  if (!hasStorage() || !dayPayload?.sourceDate || !directVariationId) return null;

  const existingRecord = readSealedRecords().find((record) => String(record?.sourceDate || '') === String(dayPayload.sourceDate));
  const sealedRecord = {
    id: `summation-${dayPayload.sourceDate}`,
    source: 'THE.SUMMATION',
    sourceDate: dayPayload.sourceDate,
    displayDate: dayPayload.displayDate,
    dayOfWeek: dayPayload.dayOfWeek,
    chaoticaDayNumber: existingRecord?.chaoticaDayNumber || getChaoticaDayNumber(dayPayload.sourceDate),
    selectedVariationId: directVariationId,
    selectedVariationName: selectedVariation.presetName || selectedVariation.name,
    renderedStoryPayload: selectedVariation,
    sourceTruthSnapshot: dayPayload,
    sealedAt: new Date().toISOString(),
  };

  const records = readSealedRecords().filter((record) => String(record?.sourceDate || '') !== String(dayPayload.sourceDate));
  window.localStorage.setItem(SUMMATION_SEALED_STORAGE_KEY, JSON.stringify([...records, sealedRecord]));
  receiveSealedSummation(sealedRecord);
  return sealedRecord;
}
