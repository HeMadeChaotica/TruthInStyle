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
const SUMMATION_ACTIVE_DAY_KEY = 'the_summation_active_day_v1';
export const SUMMATION_ACTIVE_DAY_CHANGED_EVENT = 'truthinstyle-summation-active-day-changed';

export const PENNY_FOR_YOUR_THOUGHTS_AREA = 'PENNY FOR YOUR THOUGHTS';

export const PENNY_FOR_YOUR_THOUGHTS_QUESTIONS = [
  { id: 'penny-1', text: 'What needs to be released before tomorrow?' },
  { id: 'penny-2', text: 'What did today prove that I keep trying to ignore?' },
  { id: 'penny-3', text: 'What part of today deserves to be remembered exactly as it happened?' },
  { id: 'penny-4', text: 'What did my body, mood, appetite, or attention reveal today?' },
  { id: 'penny-5', text: 'What truth am I sealing, not explaining away?' },
  { id: 'penny-6', text: 'What moment today changed the room, even quietly?' },
  { id: 'penny-7', text: 'What did I survive today that future me should not minimize?' },
  { id: 'penny-8', text: 'What felt louder than it looked?' },
  { id: 'penny-9', text: 'What did I want, and what did I actually choose?' },
  { id: 'penny-10', text: 'What part of me showed up today without asking for applause?' },
];

export function createEmptyPennyForYourThoughts() {
  return {
    selectedQuestionIds: [],
    answers: [],
  };
}

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

function preserveText(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}


function normalizeAssuredPennyQuestions(value = []) {
  return (Array.isArray(value) ? value : [])
    .map((entry) => ({
      id: cleanText(entry?.id),
      question: cleanText(entry?.question || entry?.text),
      answer: preserveText(entry?.answer),
    }))
    .filter((entry) => entry.id && entry.question)
    .slice(0, 2);
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


export function getStoredSummationActiveDay(fallbackDate = new Date()) {
  if (!hasStorage()) {
    const sourceDate = getLocalDateKey(fallbackDate);
    return { sourceDate, displayDate: formatDisplayDate(fallbackDate), dayOfWeek: dayOfWeek(fallbackDate) };
  }
  const stored = safeJsonParse(window.localStorage.getItem(SUMMATION_ACTIVE_DAY_KEY), null);
  if (stored?.sourceDate) return stored;
  const sourceDate = getLocalDateKey(fallbackDate);
  return { sourceDate, displayDate: formatDisplayDate(fallbackDate), dayOfWeek: dayOfWeek(fallbackDate) };
}


export async function resolveSummationActiveDay(dateOverride = null) {
  const baseDate = dateOverride ? (dateOverride instanceof Date ? dateOverride : new Date(dateOverride)) : null;
  const stored = !baseDate && hasStorage() ? safeJsonParse(window.localStorage.getItem(SUMMATION_ACTIVE_DAY_KEY), null) : null;
  const sourceDate = baseDate ? getLocalDateKey(baseDate) : stored?.sourceDate;
  const activeDate = sourceDate ? new Date(`${sourceDate}T00:00:00`) : new Date();
  if (Number.isNaN(activeDate.getTime())) return null;
  const dayPayload = await readAssurerDayForSummation(activeDate).catch(() => null);
  const display = dayPayload?.displayDate || formatDisplayDate(activeDate);
  const title = cleanText(dayPayload?.titleOfDay || dayPayload?.title) || `Summation for ${display}`;
  return {
    ...(dayPayload || {}),
    sourceDate: dayPayload?.sourceDate || getLocalDateKey(activeDate),
    displayDate: display,
    dayOfWeek: dayPayload?.dayOfWeek || dayOfWeek(activeDate),
    chaoticaDayNumber: dayPayload?.chaoticaDayNumber || getChaoticaDayNumber(dayPayload?.sourceDate || getLocalDateKey(activeDate)),
    titleOfDay: title,
    title,
    fullAssurerDaySnapshot: dayPayload || null,
    availableSourceSignals: dayPayload?.sourceAvailability || {},
    sourceAvailability: dayPayload?.sourceAvailability || {},
  };
}

export function setStoredSummationActiveDay(date = new Date()) {
  const activeDate = date instanceof Date ? date : new Date(date);
  const payload = {
    sourceDate: getLocalDateKey(activeDate),
    displayDate: formatDisplayDate(activeDate),
    dayOfWeek: dayOfWeek(activeDate),
    updatedAt: new Date().toISOString(),
  };
  if (hasStorage()) {
    window.localStorage.setItem(SUMMATION_ACTIVE_DAY_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent(SUMMATION_ACTIVE_DAY_CHANGED_EVENT, { detail: payload }));
  }
  return payload;
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

function normalizePennyForYourThoughts(value = createEmptyPennyForYourThoughts()) {
  const parsed = typeof value === 'string' ? safeJsonParse(value, createEmptyPennyForYourThoughts()) : value;
  const selectedQuestionIds = (Array.isArray(parsed?.selectedQuestionIds) ? parsed.selectedQuestionIds : [])
    .map(cleanText)
    .filter(Boolean)
    .slice(0, 2);
  const answerRows = Array.isArray(parsed?.answers) ? parsed.answers : [];
  const answerById = new Map(answerRows.map((answer) => [cleanText(answer?.questionId), answer]));

  return {
    selectedQuestionIds,
    answers: PENNY_FOR_YOUR_THOUGHTS_QUESTIONS
      .filter((question) => selectedQuestionIds.includes(question.id))
      .map((question) => {
        const answer = answerById.get(question.id) || {};
        return {
          questionId: question.id,
          questionText: question.text,
          answerText: preserveText(answer.answerText),
        };
      }),
  };
}

export function isSummationSketchSealable(payload) {
  const parsedPayload = typeof payload === 'string' ? safeJsonParse(payload, null) : payload;
  const pennyForYourThoughts = parsedPayload?.pennyForYourThoughts;
  if (!parsedPayload || !pennyForYourThoughts) return false;

  const selectedQuestionIds = Array.isArray(pennyForYourThoughts.selectedQuestionIds)
    ? pennyForYourThoughts.selectedQuestionIds.map(cleanText).filter(Boolean)
    : [];
  const answers = Array.isArray(pennyForYourThoughts.answers) ? pennyForYourThoughts.answers : [];
  if (selectedQuestionIds.length !== 2 || answers.length !== 2) return false;

  const selectedQuestionIdSet = new Set(selectedQuestionIds);
  if (selectedQuestionIdSet.size !== 2) return false;

  const answerQuestionIds = answers.map((answer) => cleanText(answer?.questionId));
  if (new Set(answerQuestionIds).size !== 2) return false;

  return answers.every((answer) => {
    const questionId = cleanText(answer?.questionId);
    return (
      selectedQuestionIdSet.has(questionId)
      && cleanText(answer?.answerText).length > 0
    );
  });
}

function mergeWrapAnswers(storedAnswers = [], pennyForYourThoughts = createEmptyPennyForYourThoughts()) {
  const selectedPennyAnswers = normalizePennyForYourThoughts(pennyForYourThoughts).answers
    .map((answer) => ({
      id: answer.questionId,
      question: answer.questionText,
      answer: preserveText(answer.answerText),
      sourceSection: 'THE.SUMMATION',
      sourceArea: PENNY_FOR_YOUR_THOUGHTS_AREA,
      sourceQuestionId: answer.questionId,
      sourceQuestionText: answer.questionText,
      sourceValue: answer.answerText,
    }))
    .filter((answer) => cleanText(answer.answer));
  return [...selectedPennyAnswers, ...(Array.isArray(storedAnswers) ? storedAnswers : [])]
    .filter((answer, index, all) => answer.answer && all.findIndex((candidate) => candidate.id === answer.id && candidate.answer === answer.answer) === index);
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

function pennySourceMetadata(sourceAnswer, usedAs) {
  if (!sourceAnswer?.sourceQuestionId) return null;
  return {
    sourceSection: 'THE.SUMMATION',
    sourceArea: PENNY_FOR_YOUR_THOUGHTS_AREA,
    sourceQuestionId: sourceAnswer.sourceQuestionId,
    sourceQuestionText: sourceAnswer.sourceQuestionText,
    sourceValue: sourceAnswer.sourceValue,
    usedAs,
  };
}

function makeTextItem(source, value, options = {}) {
  const text = truncateText(value, options.maxLength || 112);
  const sourceKey = cleanText(options.sourceKey);
  return text && sourceKey ? {
    source,
    sourceKey,
    sourceSection: options.sourceSection || 'THE.ASSURER',
    sourceField: options.sourceField || sourceKey,
    sourceValue: cleanText(value),
    usedAs: options.usedAs || 'text',
    text,
    role: options.role || 'line',
  } : null;
}

function makeVisualItem(source, value, form, sourceKey = 'otherAssurerSource', options = {}) {
  const text = truncateText(value, options.maxLength || 92);
  return text ? {
    source,
    sourceKey,
    sourceSection: options.sourceSection || 'THE.ASSURER',
    sourceField: options.sourceField || sourceKey,
    sourceValue: cleanText(value),
    usedAs: options.usedAs || 'drawing',
    kind: options.kind || '',
    glyph: options.glyph || '✧',
    label: options.label || source,
    id: options.id || cleanText(source).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    text,
    form,
  } : null;
}

function makeFocalItem(source, value, sourceKey, options = {}) {
  const text = truncateText(value, 88);
  const sourceMap = pennySourceMetadata(options.sourceAnswer, options.usedAs || 'focal');
  return text && sourceKey ? { source, sourceKey, text, ...(sourceMap ? { sourceMap } : {}) } : null;
}

function firstFocalItem(...items) {
  return items.find((item) => item?.text) || null;
}


function collectPennySourceMap(remix) {
  return [
    ...remix.text.map((item) => ({ item, usedAs: 'text' })),
    ...remix.drawings.map((item) => ({ item, usedAs: 'drawing' })),
    ...remix.animated.map((item) => ({ item, usedAs: 'animation' })),
    ...remix.icons.map((item) => ({ item, usedAs: 'icon' })),
    ...remix.texture.map((item) => ({ item, usedAs: 'texture' })),
    ...(remix.focal ? [{ item: remix.focal, usedAs: 'focal' }] : []),
  ]
    .map(({ item, usedAs }) => item?.sourceMap ? { ...item.sourceMap, usedAs } : null)
    .filter(Boolean);
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


function pennyThoughtItems(wrapAnswers) {
  return (Array.isArray(wrapAnswers) ? wrapAnswers : [])
    .filter((answer) => cleanText(answer.answer))
    .slice(0, 2)
    .map((answer, index) => ({
      sourceSection: 'THE.SUMMATION',
      sourceArea: 'PENNY FOR YOUR THOUGHTS',
      sourceQuestionId: cleanText(answer.id || `penny-${index + 1}`),
      sourceQuestionText: cleanText(answer.question),
      sourceValue: cleanText(answer.answer),
      usedAs: index === 0 ? 'text / final truth pin' : 'text / closing note',
      text: truncateText(answer.answer, 120),
    }));
}

function proofRowsForMasquerade(dayPayload, masque) {
  return [
    ...masque.text,
    ...masque.maskCluster,
    ...masque.momentPins,
    ...masque.animated,
    ...masque.icons,
    ...masque.pennyAnswers.map((item) => ({
      sourceSection: item.sourceSection,
      sourceField: item.sourceQuestionText || item.sourceQuestionId,
      sourceValue: item.sourceValue,
      usedAs: item.usedAs,
    })),
    makeVisualItem('Full Assured Thoughts', dayPayload.assuredThoughts, 'proof drawer exact text', 'assuredThoughts', { usedAs: 'raw proof', sourceField: 'assuredThoughts', maxLength: 240 }),
    ...(dayPayload.mealHighlights || []).map((meal) => makeVisualItem('Meal detail', [meal.time, meal.label, meal.macroText, meal.status].filter(Boolean).join(' · '), 'proof drawer exact meal', 'mealLogHighlights', { sourceSection: 'DA.EATER via THE.ASSURER', usedAs: 'raw proof', sourceField: 'mealLogHighlights', maxLength: 180 })),
    ...(dayPayload.workoutHighlights || []).map((workoutValue) => makeVisualItem('Workout detail', workoutValue, 'proof drawer exact workout', 'workoutHighlights', { sourceSection: 'THICC.FITT via THE.ASSURER', usedAs: 'raw proof', sourceField: 'workoutHighlights', maxLength: 180 })),
    ...(dayPayload.macroHighlights || []).map((macro) => makeVisualItem('Macro detail', [macro.label, macro.current, macro.left && `${macro.left} LEFT`, macro.percent !== null ? `${macro.percent}%` : ''].filter(Boolean).join(' · '), 'proof drawer exact macro', 'macroHighlights', { sourceSection: 'DA.EATER via THE.ASSURER', usedAs: 'raw proof', sourceField: 'macroHighlights', maxLength: 180 })),
    ...(dayPayload.timelineHighlights || []).map((entry) => makeVisualItem('Event detail', [entry.time, entry.text || entry.type].filter(Boolean).join(' · '), 'proof drawer exact event', 'timelineHighlights', { sourceSection: 'REMEMBER.ME via THE.ASSURER', usedAs: 'raw proof', sourceField: 'timelineHighlights', maxLength: 180 })),
  ]
    .filter(Boolean)
    .map((row) => ({
      sourceSection: row.sourceSection || 'THE.ASSURER',
      sourceField: row.sourceField || row.sourceKey || row.source || 'sourceValue',
      sourceValue: cleanText(row.sourceValue || row.text),
      usedAs: row.usedAs || row.form || 'source mapping',
    }))
    .filter((row) => row.sourceValue)
    .slice(0, 34);
}

export const SUMMATION_REMIX_PRESETS = [
  {
    id: 'variation-1',
    selectorLabel: 'THE MASQUERADE MAP',
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
  const pennyAnswerById = (id) => wrapAnswers.find((answer) => answer.id === id && answer.sourceArea === PENNY_FOR_YOUR_THOUGHTS_AREA);
  const firstPennyAnswer = wrapAnswers.find((answer) => answer.sourceArea === PENNY_FOR_YOUR_THOUGHTS_AREA);
  const releaseAnswerSource = pennyAnswerById('penny-1') || firstPennyAnswer;
  const truthAnswerSource = pennyAnswerById('penny-5') || firstPennyAnswer;
  const futureAnswerSource = pennyAnswerById('penny-7') || firstPennyAnswer;
  const definedAnswer = releaseAnswerSource ? makeTextItem(releaseAnswerSource.question, releaseAnswerSource.answer, { sourceKey: 'pennyForYourThoughts', role: 'wrap', maxLength: 100, sourceAnswer: releaseAnswerSource }) : null;
  const truthAnswer = truthAnswerSource ? makeTextItem(truthAnswerSource.question, truthAnswerSource.answer, { sourceKey: 'pennyForYourThoughts', role: 'truth', maxLength: 100, sourceAnswer: truthAnswerSource }) : null;
  const futureAnswer = futureAnswerSource ? makeTextItem(futureAnswerSource.question, futureAnswerSource.answer, { sourceKey: 'pennyForYourThoughts', role: 'future', maxLength: 100, sourceAnswer: futureAnswerSource }) : null;
  const wrapTextItems = wrapAnswers
    .filter((answer) => answer.sourceArea === PENNY_FOR_YOUR_THOUGHTS_AREA)
    .map((answer) => makeTextItem(answer.question, answer.answer, { sourceKey: 'pennyForYourThoughts', role: 'wrap', maxLength: 100, sourceAnswer: answer }));

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
  const assuredTruth = makeTextItem('Final sealed truth', dayPayload.assuredThoughts, { sourceKey: 'assuredThoughts', role: 'truth' });
  const finalTruth = truthAnswer || assuredTruth;

  const byPreset = {
    'variation-1': (() => {
      const pennyAnswers = pennyThoughtItems(wrapAnswers);
      const text = compactItems([
        titleItem,
        dateItem,
        wordItem,
        assuredExcerpt,
      ], 4);
      const maskCluster = compactItems([
        makeVisualItem('Mood', dayPayload.mood, 'masquerade mask doodle', 'mood', { id: 'mood-mask', glyph: '◕', usedAs: 'drawing', sourceField: 'mood' }),
        makeVisualItem('Era', dayPayload.era, 'costume / posture sketch', 'era', { id: 'era-posture', glyph: '♟', usedAs: 'drawing', sourceField: 'era' }),
        makeVisualItem('Singleness Level', dayPayload.singlenessLevel, 'heart-orbit symbol', 'singlenessLevel', { id: 'singleness-orbit', glyph: '♡', usedAs: 'drawing', sourceField: 'singlenessLevel' }),
      ], 3);
      const momentPins = compactItems([
        makeVisualItem('WOW', wow, 'small masquerade scene pin', 'moments', { id: 'wow-pin', label: 'WOW', glyph: '✧', usedAs: 'drawing', sourceSection: 'REMEMBER.ME via THE.ASSURER', sourceField: 'wowMoment' }),
        makeVisualItem('WTF', wtf, 'small masquerade scene pin', 'moments', { id: 'wtf-pin', label: 'WTF', glyph: '☽', usedAs: 'drawing', sourceSection: 'REMEMBER.ME via THE.ASSURER', sourceField: 'wtfMoment' }),
        makeVisualItem('PLOT TWIST', plotTwist, 'small masquerade scene pin', 'moments', { id: 'plot-twist-pin', label: 'PLOT TWIST', glyph: '⟡', usedAs: 'drawing', sourceSection: 'REMEMBER.ME via THE.ASSURER', sourceField: 'plotTwistMoment' }),
      ], 3);
      const animated = compactItems([
        makeVisualItem('Battle Cry', dayPayload.battleCry?.text, 'slow moving ribbon line', 'battleCry', { kind: 'battle-ribbon', glyph: '〰', usedAs: 'animation', sourceSection: 'THICC.FITT via THE.ASSURER', sourceField: 'battleCry', maxLength: 110 }),
        makeVisualItem('Head Hummer', dayPayload.headHummer, 'pulsing music-note marks', 'headHummer', { kind: 'head-hummer-notes', glyph: '♪', usedAs: 'animation', sourceField: 'headHummer' }),
      ], 2);
      const icons = compactItems([
        makeVisualItem('Location', location, 'ballroom floor marker', 'location', { kind: 'location-marker', glyph: '⌖', usedAs: 'icon / floor marker', sourceField: 'location' }),
        makeVisualItem('Weather', weather, 'atmospheric haze / tiny weather glyph', 'weather', { kind: 'weather-haze', glyph: '☁', usedAs: 'icon / atmospheric haze', sourceField: 'weather' }),
        makeVisualItem('Meal signal', food, 'tiny table / plate pin', 'mealLogHighlights', { kind: 'meal-pin', glyph: '◌', usedAs: 'icon / texture', sourceSection: 'DA.EATER via THE.ASSURER', sourceField: 'mealLogHighlights' }),
        makeVisualItem('Workout signal', workout, 'tiny movement path / step mark', 'workoutHighlights', { kind: 'workout-path', glyph: '⋯', usedAs: 'icon / movement path', sourceSection: 'THICC.FITT via THE.ASSURER', sourceField: 'workoutHighlights' }),
        makeVisualItem('Timeline fleck', timeline, 'event fleck', 'timelineHighlights', { kind: 'timeline-fleck', glyph: '•', usedAs: 'texture / event fleck', sourceSection: 'REMEMBER.ME via THE.ASSURER', sourceField: 'timelineHighlights' }),
      ], 5);
      const remix = {
        text,
        drawings: [...maskCluster, ...momentPins],
        maskCluster,
        momentPins,
        animated,
        icons,
        texture: compactItems([
          makeVisualItem('Weather', weather, 'smoked ivory atmospheric haze', 'weather', { usedAs: 'texture', sourceField: 'weather' }),
          makeVisualItem('Location', location, 'ballroom room haze', 'location', { usedAs: 'texture', sourceField: 'location' }),
        ], 2),
        pennyAnswers,
        focal: firstFocalItem(
          makeFocalItem('Title of the Day', title, 'titleOfDay'),
          makeFocalItem('Word of the Day', dayPayload.wordOfDay?.word, 'wordOfDay'),
        ),
      };
      remix.proofRows = proofRowsForMasquerade(dayPayload, remix);
      return remix;
    })(),
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
    maskCluster: remix.maskCluster || [],
    momentPins: remix.momentPins || [],
    pennyAnswers: remix.pennyAnswers || [],
    proofRows: remix.proofRows || [],
    storyFragments: storyFragments.slice(0, 9),
    sourceMap: {
      text: preset.textSources,
      drawing: preset.drawingSources,
      animated: preset.animatedSources,
      smallIcon: preset.smallIconSources,
      backgroundTexture: preset.backgroundTextureSources,
      title: titleItem ? { source: titleItem.source, sourceKey: titleItem.sourceKey, text: titleItem.text } : null,
      emotionalFocalPoint: remix.focal ? { source: remix.focal.source, sourceKey: remix.focal.sourceKey, text: remix.focal.text } : null,
      renderedItems: [
        ...remix.text,
        ...remix.drawings,
        ...remix.animated,
        ...remix.icons,
        ...(remix.pennyAnswers || []),
      ].filter(Boolean),
      proofRows: remix.proofRows || [],
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
  const pennyQuestions = normalizeAssuredPennyQuestions(assurerDayPayload?.pennyQuestions);
  const pennyAnswers = pennyQuestions.filter((entry) => cleanText(entry.answer)).map((entry) => ({
    id: entry.id,
    question: entry.question,
    answer: entry.answer,
    answerText: entry.answer,
    sourceArea: PENNY_FOR_YOUR_THOUGHTS_AREA,
    sourceSection: 'THE.ASSURER ASSURED THOUGHTS',
  }));

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
    pennyQuestions,
    pennyAnswers,
    pennyForYourThoughts: {
      selectedQuestionIds: pennyQuestions.map((entry) => entry.id),
      answers: pennyAnswers,
    },
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
      pennyQuestions: Boolean(pennyQuestions.length),
      pennyAnswers: Boolean(pennyAnswers.length),
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

export function generateSummationVariations(dayPayload = null, pennyForYourThoughts = createEmptyPennyForYourThoughts()) {
  const payload = dayPayload || {};
  const mergedWrapAnswers = mergeWrapAnswers(payload.wrapAnswers, pennyForYourThoughts);
  return SUMMATION_REMIX_PRESETS.map((preset) => buildPresetRemix(payload, preset, mergedWrapAnswers));
}

export function generateSummationSketchStory(dayPayload = null, selectedVariation = 'THE MASQUERADE MAP', wrapAnswers = {}) {
  const variations = generateSummationVariations(dayPayload, wrapAnswers);
  const selectedNumber = Number(cleanText(selectedVariation).match(/\d+/)?.[0] || 1);
  return variations[selectedNumber - 1] || variations[0];
}

export function buildSummationSealPayload(selectedVariation, pennyForYourThoughts = createEmptyPennyForYourThoughts()) {
  if (!selectedVariation) return null;
  const sealPayload = {
    ...selectedVariation,
    variationId: selectedVariation.variationId || selectedVariation.id,
    presetName: selectedVariation.presetName || selectedVariation.name,
    pennyForYourThoughts,
  };
  if (!isSummationSketchSealable(sealPayload)) return null;
  return {
    ...sealPayload,
    pennyForYourThoughts: normalizePennyForYourThoughts(pennyForYourThoughts),
  };
}

export function sealSummationVariation(dayPayload, selectedVariation) {
  const directVariationId = selectedVariation?.variationId || selectedVariation?.id;
  if (!hasStorage() || !dayPayload?.sourceDate || !directVariationId || !isSummationSketchSealable(selectedVariation)) return null;

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

const SUMMATION_DRAFT_KEY = 'the_summation_active_draft_v1';
const SUMMATION_VERSIONS_KEY = 'the_summation_versions_v1';
const SUMMATION_SKETCHES_KEY = 'the_summation_sketches_v1';
const SUMMATION_VERSION_STATE_KEY = 'the_summation_version_state_v1';
const COMPLETED_SUMMATION_KEY = 'completed_summation_sketch';

function readStorageArray(key) {
  if (!hasStorage()) return [];
  const parsed = safeJsonParse(window.localStorage.getItem(key), []);
  return Array.isArray(parsed) ? parsed : [];
}

function writeStorageArray(key, records) {
  if (hasStorage()) window.localStorage.setItem(key, JSON.stringify(records));
}

function writeStorageObject(key, record) {
  if (hasStorage()) window.localStorage.setItem(key, JSON.stringify(record));
}

function summationId(prefix, dateKey, label = '') {
  return `${prefix}-${cleanText(dateKey) || 'undated'}-${cleanText(label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || Date.now()}`;
}

function fullSourceTruthFromDraft(draft) {
  const dayPayload = draft?.sourceTruth || draft?.dayPayload || draft?.fullAssurerDaySnapshot || {};
  return {
    ...dayPayload,
    ...(draft?.completed?.sourceTruth || {}),
    ...dayPayload,
    source: dayPayload.source || draft?.source || 'THE.ASSURER',
    sourceDate: dayPayload.sourceDate || draft?.sourceDate,
    displayDate: dayPayload.displayDate || draft?.displayDate,
    dayOfWeek: dayPayload.dayOfWeek || draft?.dayOfWeek,
    chaoticaDayNumber: dayPayload.chaoticaDayNumber || draft?.chaoticaDayNumber,
  };
}

function normalizeSummationDraft(input) {
  if (!input) return null;
  const sourceTruth = fullSourceTruthFromDraft(input);
  const missing = [];
  if (!sourceTruth.sourceDate) missing.push('sourceDate');
  if (!sourceTruth.displayDate) missing.push('displayDate');
  if (!input.id && !sourceTruth.sourceDate) missing.push('draft identity');
  if (!isPresent(input.sourceTruth || input.fullAssurerDaySnapshot || input.dayPayload || sourceTruth)) missing.push('sourceTruth/full Assurer snapshot');
  if (missing.length) {
    if (typeof console !== 'undefined') console.warn('Invalid Summation draft missing fields:', missing.join(', '));
    return null;
  }
  const now = new Date().toISOString();
  return {
    id: input.id || input.draftId || `summation-draft-${sourceTruth.sourceDate}`,
    draftId: input.draftId || input.id || `summation-draft-${sourceTruth.sourceDate}`,
    source: 'THE.ASSURER',
    sourceDate: sourceTruth.sourceDate,
    displayDate: sourceTruth.displayDate,
    dayOfWeek: sourceTruth.dayOfWeek,
    chaoticaDayNumber: sourceTruth.chaoticaDayNumber || getChaoticaDayNumber(sourceTruth.sourceDate),
    titleOfDay: sourceTruth.titleOfDay || sourceTruth.title || input.titleOfDay || `Summation for ${sourceTruth.displayDate}`,
    title: sourceTruth.titleOfDay || sourceTruth.title || input.title || input.titleOfDay || `Summation for ${sourceTruth.displayDate}`,
    fullAssurerDaySnapshot: input.fullAssurerDaySnapshot || input.dayPayload || sourceTruth,
    sourceTruth,
    availableSourceSignals: input.availableSourceSignals || sourceTruth.availableSourceSignals || sourceTruth.sourceAvailability || {},
    sourceMetadata: input.sourceMetadata || sourceTruth.sourceMetadata || { intake: 'Crystal Wand / Summate', sourceSchemaPreserved: true },
    pennyForYourThoughts: input.pennyForYourThoughts || sourceTruth.pennyForYourThoughts || null,
    pennyAnswers: normalizePennyAnswers({ ...input, sourceTruth }),
    sourceAnswers: input.sourceAnswers || sourceTruth.sourceAnswers || sourceTruth.wrapAnswers || [],
    status: input.status || 'draft',
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}


function normalizePennyAnswers(draft = {}) {
  const sourceTruth = draft?.sourceTruth || {};
  const pools = [
    draft?.pennyAnswers,
    draft?.pennyForYourThoughts?.answers,
    draft?.pennyForYourThoughts,
    sourceTruth?.pennyAnswers,
    sourceTruth?.pennyForYourThoughts?.answers,
    sourceTruth?.pennyForYourThoughts,
    sourceTruth?.sourceAnswers,
    draft?.sourceAnswers,
    sourceTruth?.wrapAnswers,
  ];
  const answers = [];
  pools.forEach((pool) => {
    const list = Array.isArray(pool) ? pool : (Array.isArray(pool?.answers) ? pool.answers : []);
    list.forEach((answer) => {
      if (!isPresent(answer)) return;
      const normalized = answer && typeof answer === 'object' && !Array.isArray(answer) ? { ...answer } : { answerText: String(answer) };
      const answerText = cleanText(normalized.answerText ?? normalized.answer ?? normalized.value ?? normalized.sourceValue ?? normalized.text ?? normalized);
      if (!answerText) return;
      const question = cleanText(normalized.questionText || normalized.question || normalized.prompt || normalized.sourceQuestionText || normalized.label);
      const key = [cleanText(normalized.id || normalized.questionId || normalized.sourceQuestionId), question, answerText].join('::');
      if (answers.some((item) => item.__dedupeKey === key)) return;
      answers.push({ ...normalized, answerText: normalized.answerText ?? normalized.answer ?? normalized.value ?? normalized.sourceValue ?? normalized.text ?? answerText, __dedupeKey: key });
    });
  });
  return answers.map(({ __dedupeKey, ...answer }) => answer);
}

function sourceTruthWithNormalizedPennyAnswers(draft) {
  const pennyAnswers = normalizePennyAnswers(draft);
  const sourceTruth = { ...(draft?.sourceTruth || {}) };
  if (!pennyAnswers.length) return sourceTruth;
  return {
    ...sourceTruth,
    pennyAnswers,
    pennyForYourThoughts: {
      ...(sourceTruth.pennyForYourThoughts || {}),
      ...(draft?.pennyForYourThoughts || {}),
      answers: pennyAnswers,
    },
  };
}

function truthLine(label, value) {
  if (!isPresent(value)) return '';
  return `${label}: ${Array.isArray(value) || typeof value === 'object' ? JSON.stringify(value) : value}`;
}

const SUMMATION_VERSION_TYPES = [
  { label: 'Clean Truth', styleLabel: 'Direct polished daily summary' },
  { label: 'Mythic Truth', styleLabel: 'Chaotica / Mista.Thicc narrative' },
  { label: 'Shadow Truth', styleLabel: 'Deeper emotional pattern' },
  { label: 'Receipt Truth', styleLabel: 'Evidence-heavy source record' },
];

function versionBodyForType(sourceTruth, type) {
  const lines = [
    truthLine('Date', `${sourceTruth.displayDate} ${sourceTruth.dayOfWeek || ''}`),
    truthLine('Title', sourceTruth.titleOfDay || sourceTruth.title),
    truthLine('Mood', sourceTruth.mood),
    truthLine('Era', sourceTruth.era),
    truthLine('Singleness', sourceTruth.singlenessLevel || sourceTruth.singleness),
    truthLine('Head hummer', sourceTruth.headHummer),
    truthLine('Word', sourceTruth.wordOfDay),
    truthLine('Assured thoughts', sourceTruth.assuredThoughts),
    truthLine('THICC.TIME', sourceTruth.weekSignal),
    truthLine('REMEMBER.ME', sourceTruth.moments || sourceTruth.timelineHighlights),
    truthLine('THICC.FITT', sourceTruth.workoutHighlights),
    truthLine('DA.EATER', sourceTruth.macroHighlights || sourceTruth.mealHighlights),
    truthLine('Penny/source answers', sourceTruth.pennyAnswers || sourceTruth.wrapAnswers),
  ].filter(Boolean);
  if (type.label === 'Mythic Truth') return [`${sourceTruth.titleOfDay || 'This day'} enters THE.SUMMATION as a Chaotica chamber record.`, ...lines].join('\n');
  if (type.label === 'Shadow Truth') return [`The deeper pattern of ${sourceTruth.displayDate} is held without performance.`, ...lines].join('\n');
  if (type.label === 'Receipt Truth') return lines.join('\n');
  return [`${sourceTruth.displayDate} is summarized from the selected THE.ASSURER day.`, ...lines].join('\n');
}

export function createSummationDraftFromAssurerDay(selectedDayPayload) {
  const now = new Date().toISOString();
  const draft = normalizeSummationDraft({
    source: 'THE.ASSURER',
    sourceDate: selectedDayPayload?.sourceDate,
    displayDate: selectedDayPayload?.displayDate,
    dayOfWeek: selectedDayPayload?.dayOfWeek,
    chaoticaDayNumber: selectedDayPayload?.chaoticaDayNumber,
    fullAssurerDaySnapshot: selectedDayPayload,
    sourceTruth: selectedDayPayload,
    availableSourceSignals: selectedDayPayload?.availableSourceSignals || selectedDayPayload?.sourceAvailability || {},
    createdAt: now,
    updatedAt: now,
    status: 'draft',
  });
  if (!draft) return null;
  writeStorageObject(SUMMATION_DRAFT_KEY, draft);
  return draft;
}

export function readSummationDraftBundle() {
  if (!hasStorage()) return null;
  const storedDraft = safeJsonParse(window.localStorage.getItem(SUMMATION_DRAFT_KEY), null);
  const completed = safeJsonParse(window.localStorage.getItem(COMPLETED_SUMMATION_KEY), null);
  const draft = normalizeSummationDraft(storedDraft || completed?.draft || completed);
  if (!draft) return null;
  const state = readSummationVersionState(draft.sourceDate);
  const versions = normalizeSummationVersionSelection(readStorageArray(SUMMATION_VERSIONS_KEY).filter((version) => version.sourceDate === draft.sourceDate), state.selectedForSealVersionId);
  persistSummationVersionSelection(draft.sourceDate, versions, state.activeVersionId);
  const sketches = readStorageArray(SUMMATION_SKETCHES_KEY).filter((sketch) => sketch.sourceDate === draft.sourceDate);
  const activeVersionId = versions.some((version) => version.id === state.activeVersionId) ? state.activeVersionId : (versions[0]?.id || '');
  const selectedForSealVersionId = versions.find((version) => version.selectedForSeal)?.id || '';
  return { draft, versions, sketches, activeVersionId, selectedForSealVersionId };
}

export function readSummationVersionState(sourceDate = '') {
  if (!hasStorage()) return { activeVersionId: '', selectedForSealVersionId: '' };
  const allState = safeJsonParse(window.localStorage.getItem(SUMMATION_VERSION_STATE_KEY), {});
  const state = allState?.[sourceDate] || {};
  return {
    activeVersionId: cleanText(state.activeVersionId),
    selectedForSealVersionId: cleanText(state.selectedForSealVersionId),
  };
}

function writeSummationVersionState(sourceDate, statePatch = {}) {
  if (!hasStorage() || !sourceDate) return readSummationVersionState(sourceDate);
  const allState = safeJsonParse(window.localStorage.getItem(SUMMATION_VERSION_STATE_KEY), {});
  const current = allState?.[sourceDate] || {};
  const next = { ...current, ...statePatch };
  window.localStorage.setItem(SUMMATION_VERSION_STATE_KEY, JSON.stringify({ ...allState, [sourceDate]: next }));
  return next;
}

function persistSummationVersionSelection(sourceDate, versions = [], activeVersionId = '') {
  const selectedForSealVersionId = versions.find((version) => version.selectedForSeal)?.id || '';
  const validActiveVersionId = versions.some((version) => version.id === activeVersionId) ? activeVersionId : (versions[0]?.id || '');
  writeSummationVersionState(sourceDate, { activeVersionId: validActiveVersionId, selectedForSealVersionId });
}

export function normalizeSummationVersionSelection(versions = [], selectedVersionId = '') {
  let selectionUsed = false;
  const selectedIds = versions.filter((version) => version.selectedForSeal).map((version) => version.id);
  const explicitId = selectedVersionId || (selectedIds.length === 1 ? selectedIds[0] : '');
  return versions.map((version) => {
    const selectedForSeal = Boolean(explicitId && version.id === explicitId && !selectionUsed);
    if (selectedForSeal) selectionUsed = true;
    return { ...version, selectedForSeal };
  });
}

export function generateSummationVersions(draftInput, options = {}) {
  const draft = normalizeSummationDraft(draftInput);
  if (!draft) return [];
  const existingAll = readStorageArray(SUMMATION_VERSIONS_KEY);
  const existingForDay = existingAll.filter((version) => version.sourceDate === draft.sourceDate);
  const normalizedSourceTruth = sourceTruthWithNormalizedPennyAnswers(draft);
  const normalizedPennyAnswers = normalizePennyAnswers({ ...draft, sourceTruth: normalizedSourceTruth });
  const now = new Date().toISOString();
  const versions = SUMMATION_VERSION_TYPES.map((type, index) => {
    const id = summationId('version', draft.sourceDate, type.label);
    const existing = existingForDay.find((version) => version.id === id);
    if (existing?.sealed) return existing;
    if (existing && options.preserveExistingEdits) return { ...existing, sourceTruth: normalizedSourceTruth, pennyAnswers: normalizedPennyAnswers };
    const body = versionBodyForType(normalizedSourceTruth, type);
    return {
      id,
      versionNumber: index + 1,
      label: type.label,
      title: `${draft.titleOfDay || 'THE.SUMMATION'} — ${type.label}`,
      styleLabel: type.styleLabel,
      body,
      content: body,
      sourceDate: draft.sourceDate,
      displayDate: draft.displayDate,
      dayOfWeek: draft.dayOfWeek,
      chaoticaDayNumber: draft.chaoticaDayNumber,
      status: 'Draft',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      selectedForSeal: false,
      sealed: existing?.sealed || false,
      sourceTruth: normalizedSourceTruth,
      sourceMetadata: draft.sourceMetadata,
      pennyForYourThoughts: normalizedSourceTruth.pennyForYourThoughts || draft.pennyForYourThoughts,
      pennyAnswers: normalizedPennyAnswers,
      sourceAnswers: draft.sourceAnswers,
      sourceTruthRef: draft.id,
      sketchId: existing?.sketchId || '',
    };
  });
  const state = readSummationVersionState(draft.sourceDate);
  const selectedIds = existingForDay.filter((version) => version.selectedForSeal).map((version) => version.id);
  const stableSelectedId = selectedIds.length === 1 && versions.some((version) => version.id === selectedIds[0]) ? selectedIds[0] : '';
  const requestedSelectedId = options.preserveSelectedVersionId === false ? '' : (options.preserveSelectedVersionId || state.selectedForSealVersionId || stableSelectedId);
  const normalizedVersions = normalizeSummationVersionSelection(versions, requestedSelectedId && versions.some((version) => version.id === requestedSelectedId) ? requestedSelectedId : '');
  writeStorageArray(SUMMATION_VERSIONS_KEY, [...existingAll.filter((version) => version.sourceDate !== draft.sourceDate), ...normalizedVersions]);
  persistSummationVersionSelection(draft.sourceDate, normalizedVersions, options.activeVersionId || state.activeVersionId);
  return normalizedVersions;
}

export function setSummationActiveVersion(versionId) {
  const versions = readStorageArray(SUMMATION_VERSIONS_KEY);
  const target = versions.find((version) => version.id === versionId);
  if (!target) return null;
  writeSummationVersionState(target.sourceDate, { activeVersionId: versionId });
  return target;
}

export function saveSummationVersionEdits(versionId, edits = {}) {
  const versions = readStorageArray(SUMMATION_VERSIONS_KEY);
  const now = new Date().toISOString();
  const next = versions.map((version) => version.id === versionId && !version.sealed ? {
    ...version,
    title: preserveText(edits.title),
    body: preserveText(edits.body),
    content: preserveText(edits.body),
    updatedAt: now,
  } : version);
  writeStorageArray(SUMMATION_VERSIONS_KEY, next);
  return next.find((version) => version.id === versionId) || null;
}

export function createOrUpdateSummationSketch({ draft: draftInput, version, doodleLayer = {} }) {
  const draft = normalizeSummationDraft(draftInput);
  if (!draft || !version?.id) return null;
  const sketches = readStorageArray(SUMMATION_SKETCHES_KEY);
  const existing = sketches.find((sketch) => sketch.linkedVersionId === version.id);
  const now = new Date().toISOString();
  const sketchId = existing?.sketchId || summationId('sketch', draft.sourceDate, version.label || version.id);
  const isSamePair = Boolean(existing && existing.linkedVersionId === version.id && existing.sketchId === sketchId);
  const shouldPreserveSealSelection = Boolean(
    isSamePair
    && existing?.selectedForSeal
    && existing?.selectedForSealVersionId === version.id
    && existing?.selectedSketchId === sketchId
  );

  if (existing?.sealed) return existing;

  const sketch = {
    sketchId,
    linkedVersionId: version.id,
    sourceDate: draft.sourceDate,
    displayDate: draft.displayDate,
    dayOfWeek: draft.dayOfWeek,
    chaoticaDayNumber: draft.chaoticaDayNumber,
    title: version.title,
    selectedVersionLabel: version.label,
    renderedText: version.body || version.content,
    doodleLayer: {
      marks: doodleLayer.marks || existing?.doodleLayer?.marks || [],
      annotationNotes: preserveText(doodleLayer.annotationNotes ?? existing?.doodleLayer?.annotationNotes),
      decorativeStrokes: doodleLayer.decorativeStrokes || existing?.doodleLayer?.decorativeStrokes || [],
      memoryMarks: doodleLayer.memoryMarks || existing?.doodleLayer?.memoryMarks || [],
      stamps: doodleLayer.stamps || existing?.doodleLayer?.stamps || [],
      positionData: doodleLayer.positionData || existing?.doodleLayer?.positionData || {},
      createdAt: existing?.doodleLayer?.createdAt || now,
      updatedAt: now,
    },
    layoutTemplateKey: existing?.layoutTemplateKey || 'summation-daily-page-v1',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    sealed: existing?.sealed || false,
    sealedAt: existing?.sealedAt,
    selectedForSeal: shouldPreserveSealSelection,
    selectedForSealVersionId: shouldPreserveSealSelection ? existing.selectedForSealVersionId : '',
    selectedSketchId: shouldPreserveSealSelection ? existing.selectedSketchId : '',
    sourceTruth: draft.sourceTruth,
    sourceMetadata: draft.sourceMetadata,
    pennyForYourThoughts: draft.pennyForYourThoughts,
    pennyAnswers: draft.pennyAnswers,
    sourceAnswers: draft.sourceAnswers,
    sourceTruthRef: draft.id,
  };
  writeStorageArray(SUMMATION_SKETCHES_KEY, [...sketches.filter((item) => item.linkedVersionId !== version.id), sketch]);
  const versions = readStorageArray(SUMMATION_VERSIONS_KEY).map((item) => item.id === version.id ? { ...item, sketchId: sketch.sketchId, updatedAt: now } : item);
  writeStorageArray(SUMMATION_VERSIONS_KEY, versions);
  return sketch;
}

export function markSummationVersionForSeal(versionId) {
  const versions = readStorageArray(SUMMATION_VERSIONS_KEY);
  const target = versions.find((version) => version.id === versionId);
  if (!target) return null;
  const sketches = readStorageArray(SUMMATION_SKETCHES_KEY);
  const targetSketch = sketches.find((sketch) => sketch.linkedVersionId === versionId);
  if (!targetSketch) return null;
  const now = new Date().toISOString();
  const nextVersions = versions.map((version) => version.sourceDate === target.sourceDate ? {
    ...version,
    selectedForSeal: version.id === versionId,
    selectedForSealVersionId: version.id === versionId ? versionId : '',
    selectedSketchId: version.id === versionId ? targetSketch.sketchId : '',
    updatedAt: version.id === versionId ? now : version.updatedAt,
  } : version);
  const nextSketches = sketches.map((sketch) => sketch.sourceDate === target.sourceDate ? {
    ...sketch,
    selectedForSeal: sketch.sketchId === targetSketch.sketchId && sketch.linkedVersionId === versionId,
    selectedForSealVersionId: sketch.sketchId === targetSketch.sketchId ? versionId : '',
    selectedSketchId: sketch.sketchId === targetSketch.sketchId ? targetSketch.sketchId : '',
    updatedAt: sketch.sketchId === targetSketch.sketchId ? now : sketch.updatedAt,
  } : sketch);
  writeStorageArray(SUMMATION_VERSIONS_KEY, nextVersions);
  writeStorageArray(SUMMATION_SKETCHES_KEY, nextSketches);
  writeStorageObject(COMPLETED_SUMMATION_KEY, { draft: readSummationDraftBundle()?.draft, version: nextVersions.find((version) => version.id === versionId) || target, sketch: nextSketches.find((sketch) => sketch.sketchId === targetSketch.sketchId) || targetSketch });
  return nextVersions.find((version) => version.id === versionId) || null;
}

export function listSummationSealMissingFields({ draft, version, sketch } = {}) {
  const sourceTruth = fullSourceTruthFromDraft(draft || version || sketch || {});
  const missing = [];
  if (!version?.id) missing.push('selectedForSealVersionId');
  if (!version?.selectedForSeal) missing.push('selectedForSealVersionId');
  if (!cleanText(version?.title)) missing.push('selected version title');
  if (!cleanText(version?.body || version?.content)) missing.push('selected version content');
  if (!sketch) missing.push('selected sketch/doodle artifact');
  if (sketch && sketch.linkedVersionId !== version?.id) missing.push('sketch linked versionId');
  if (!cleanText(sketch?.sketchId)) missing.push('sketchId');
  if (sketch && !isPresent(sketch?.doodleLayer) && !cleanText(sketch?.layoutTemplateKey)) missing.push('sketch artifact identity');
  if (!cleanText(sourceTruth.displayDate || version?.displayDate || sketch?.displayDate)) missing.push('displayDate');
  if (!cleanText(sourceTruth.sourceDate || version?.sourceDate || sketch?.sourceDate)) missing.push('sourceDate');
  if (!cleanText(sourceTruth.dayOfWeek || version?.dayOfWeek || sketch?.dayOfWeek)) missing.push('dayOfWeek');
  if (!cleanText(sourceTruth.chaoticaDayNumber || version?.chaoticaDayNumber || sketch?.chaoticaDayNumber)) missing.push('chaoticaDayNumber');
  if (!isPresent(sourceTruth)) missing.push('source truth payload');
  if (!isPresent(draft?.fullAssurerDaySnapshot || sourceTruth)) missing.push('full Assurer snapshot');
  if (!cleanText(draft?.draftId || draft?.id || version?.sourceTruthRef || sketch?.sourceTruthRef)) missing.push('draftId/source identity');
  return missing;
}

function mergeTruthy(...payloads) {
  return payloads.reduce((merged, payload) => {
    if (!payload || typeof payload !== 'object') return merged;
    Object.entries(payload).forEach(([key, value]) => {
      if (isPresent(value) || !(key in merged)) merged[key] = value;
    });
    return merged;
  }, {});
}

export function resolveSummationSealPayload({ completed = null, draft = null, version = null, sketch = null } = {}) {
  const completedSourceTruth = completed?.sourceTruth || completed?.draft?.sourceTruth || {};
  const activeDay = getStoredSummationActiveDay(draft?.sourceDate ? new Date(`${draft.sourceDate}T00:00:00`) : new Date());
  const sourceTruth = mergeTruthy(
    completedSourceTruth,
    completed,
    completed?.draft,
    activeDay,
    draft?.sourceTruth,
    draft?.fullAssurerDaySnapshot,
    version?.sourceTruth,
    sketch?.sourceTruth,
  );
  const normalizedTruth = fullSourceTruthFromDraft({
    ...(draft || {}),
    sourceTruth,
    sourceDate: sourceTruth.sourceDate || draft?.sourceDate || version?.sourceDate || sketch?.sourceDate,
    displayDate: sourceTruth.displayDate || draft?.displayDate || version?.displayDate || sketch?.displayDate,
    dayOfWeek: sourceTruth.dayOfWeek || draft?.dayOfWeek || version?.dayOfWeek || sketch?.dayOfWeek,
    chaoticaDayNumber: sourceTruth.chaoticaDayNumber || draft?.chaoticaDayNumber || version?.chaoticaDayNumber || sketch?.chaoticaDayNumber,
  });
  const selectedVersionContent = version?.body || version?.content || sketch?.renderedText || '';
  const sourceSignals = {
    ...(draft?.availableSourceSignals || {}),
    ...(normalizedTruth.availableSourceSignals || normalizedTruth.sourceAvailability || {}),
    thiccTime: normalizedTruth.weekSignal,
    rememberMe: normalizedTruth.moments || normalizedTruth.timelineHighlights,
    thiccFitt: normalizedTruth.workoutHighlights,
    daEater: normalizedTruth.macroHighlights || normalizedTruth.mealHighlights,
    pennyAnswers: normalizedTruth.pennyAnswers || normalizedTruth.wrapAnswers || completed?.pennyForYourThoughts?.answers || [],
  };
  const now = new Date().toISOString();
  return {
    id: `summation-${normalizedTruth.sourceDate}-${sketch?.sketchId}`,
    source: 'THE.SUMMATION',
    sourceDate: normalizedTruth.sourceDate,
    displayDate: normalizedTruth.displayDate,
    dayOfWeek: normalizedTruth.dayOfWeek,
    chaoticaDayNumber: normalizedTruth.chaoticaDayNumber || getChaoticaDayNumber(normalizedTruth.sourceDate),
    title: normalizedTruth.titleOfDay || version?.title || sketch?.title || draft?.title,
    mood: normalizedTruth.mood,
    era: normalizedTruth.era,
    singleness: normalizedTruth.singlenessLevel || normalizedTruth.singleness,
    selectedVersionId: version?.id,
    selectedVersionLabel: version?.label,
    selectedVersionContent,
    selectedSketchId: sketch?.sketchId,
    sketchArtifact: sketch,
    doodleLayer: sketch?.doodleLayer,
    sourceTruthSnapshot: normalizedTruth,
    fullAssurerDaySnapshot: draft?.fullAssurerDaySnapshot || normalizedTruth,
    sourceSignals,
    sourceMetadata: {
      ...(draft?.sourceMetadata || {}),
      draftId: draft?.draftId || draft?.id,
      sourceTruthRef: draft?.id || version?.sourceTruthRef || sketch?.sourceTruthRef,
    },
    future525600: {
      sourceDate: normalizedTruth.sourceDate,
      displayDate: normalizedTruth.displayDate,
      chaoticaDayNumber: normalizedTruth.chaoticaDayNumber || getChaoticaDayNumber(normalizedTruth.sourceDate),
      mood: normalizedTruth.mood,
      era: normalizedTruth.era,
      singleness: normalizedTruth.singlenessLevel || normalizedTruth.singleness,
      title: normalizedTruth.titleOfDay || version?.title || sketch?.title || draft?.title,
      sourceSignals,
      selectedVersionLabel: version?.label,
      sketchId: sketch?.sketchId,
      sealedAt: now,
    },
    sealedAt: now,
  };
}

export function sealActiveSummationSelection(completed = null, selectedVersionId = '') {
  if (!hasStorage()) return { sealedRecord: null, missingFields: ['localStorage'] };
  const rawVersions = readStorageArray(SUMMATION_VERSIONS_KEY);
  const bundle = readSummationDraftBundle();
  const draft = bundle?.draft || completed?.draft || null;
  const rawSelectedVersions = rawVersions.filter((item) => item.sourceDate === draft?.sourceDate && item.selectedForSeal);
  const selectedVersions = rawSelectedVersions;
  if (selectedVersions.length > 1) {
    const missingFields = ['Multiple versions selected for seal. Please select one.'];
    window.dispatchEvent(new CustomEvent('truthinstyle-summation-seal-blocked', { detail: { message: missingFields[0], missingFields } }));
    return { sealedRecord: null, missingFields };
  }
  const explicitId = selectedVersions.some((version) => version.id === selectedVersionId) ? selectedVersionId : (selectedVersions[0]?.id || '');
  if (!explicitId) {
    const missingFields = ['Select a sketch/version pair for seal first.'];
    if (typeof console !== 'undefined') console.warn('THE.SUMMATION seal blocked:', missingFields[0]);
    window.dispatchEvent(new CustomEvent('truthinstyle-summation-seal-blocked', { detail: { message: missingFields[0], missingFields } }));
    return { sealedRecord: null, missingFields };
  }
  const normalizedVersions = normalizeSummationVersionSelection(bundle?.versions || [], explicitId);
  writeStorageArray(SUMMATION_VERSIONS_KEY, readStorageArray(SUMMATION_VERSIONS_KEY).map((item) => item.sourceDate === draft?.sourceDate ? (normalizedVersions.find((version) => version.id === item.id) || item) : item));
  const version = normalizedVersions.find((item) => item.id === explicitId && item.selectedForSeal) || null;
  const sketch = bundle?.sketches?.find((item) => item.linkedVersionId === version?.id && item.selectedForSeal && item.selectedForSealVersionId === version?.id) || null;
  const missingFields = listSummationSealMissingFields({ draft, version, sketch });
  if (missingFields.length) {
    if (typeof console !== 'undefined') console.warn('THE.SUMMATION seal blocked:', missingFields.join(', '));
    window.dispatchEvent(new CustomEvent('truthinstyle-summation-seal-blocked', { detail: { message: `Seal blocked: ${missingFields.join(', ')}`, missingFields } }));
    return { sealedRecord: null, missingFields };
  }
  const sourceTruth = fullSourceTruthFromDraft({ ...draft, sourceTruth: { ...version.sourceTruth, ...sketch.sourceTruth, ...draft.sourceTruth } });
  const now = new Date().toISOString();
  const sealedRecord = {
    id: `summation-${sourceTruth.sourceDate}-${sketch.sketchId}`,
    source: 'THE.SUMMATION',
    sourceDate: sourceTruth.sourceDate,
    displayDate: sourceTruth.displayDate,
    dayOfWeek: sourceTruth.dayOfWeek,
    chaoticaDayNumber: sourceTruth.chaoticaDayNumber,
    title: sourceTruth.titleOfDay || version.title,
    mood: sourceTruth.mood,
    era: sourceTruth.era,
    singleness: sourceTruth.singlenessLevel || sourceTruth.singleness,
    selectedVersionId: version.id,
    selectedVersionLabel: version.label,
    selectedVersionContent: version.body || version.content,
    selectedSketchId: sketch.sketchId,
    sketchArtifact: sketch,
    doodleLayer: sketch.doodleLayer,
    sourceTruthSnapshot: sourceTruth,
    fullAssurerDaySnapshot: draft.fullAssurerDaySnapshot || sourceTruth,
    sourceMetadata: draft.sourceMetadata,
    pennyForYourThoughts: draft.pennyForYourThoughts,
    pennyAnswers: draft.pennyAnswers,
    sourceAnswers: draft.sourceAnswers,
    sourceSignals: {
      thiccTime: sourceTruth.weekSignal,
      rememberMe: sourceTruth.moments || sourceTruth.timelineHighlights,
      thiccFitt: sourceTruth.workoutHighlights,
      daEater: sourceTruth.macroHighlights || sourceTruth.mealHighlights,
      pennyAnswers: sourceTruth.pennyAnswers || sourceTruth.wrapAnswers || [],
    },
    sealedAt: now,
  };
  const records = readSealedRecords().filter((record) => record.id !== sealedRecord.id && String(record.sourceDate) !== String(sealedRecord.sourceDate));
  writeStorageArray(SUMMATION_SEALED_STORAGE_KEY, [...records, sealedRecord]);
  receiveSealedSummation(sealedRecord);
  writeStorageArray(SUMMATION_VERSIONS_KEY, readStorageArray(SUMMATION_VERSIONS_KEY).map((item) => item.sourceDate === version.sourceDate ? { ...item, sealed: item.id === version.id ? true : item.sealed, selectedForSeal: item.id === version.id, updatedAt: item.id === version.id ? now : item.updatedAt } : item));
  writeStorageArray(SUMMATION_SKETCHES_KEY, readStorageArray(SUMMATION_SKETCHES_KEY).map((item) => item.sourceDate === sketch.sourceDate ? { ...item, sealed: item.sketchId === sketch.sketchId ? true : item.sealed, selectedForSeal: item.sketchId === sketch.sketchId, updatedAt: item.sketchId === sketch.sketchId ? now : item.updatedAt } : item));
  window.dispatchEvent(new CustomEvent('truthinstyle-summation-sealed', { detail: { sealedRecord, message: `Sealed ${sealedRecord.displayDate}` } }));
  return { sealedRecord, missingFields: [] };
}
