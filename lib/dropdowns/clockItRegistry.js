import { useEffect, useState } from 'react';
import { readSettings, writeSettings } from '../mmocStore';
import { DEFAULT_DROPDOWNS, DROPDOWN_KEYS } from './dropdownOptions';
import { optionRegistry } from './optionRegistry';

export const CLOCK_IT_CHANGED_EVENT = 'chaotica:clock-it-changed';

export const CLOCK_IT_KEYS = Object.freeze({
  mood: DROPDOWN_KEYS.assessmentMood,
  era: DROPDOWN_KEYS.assessmentEra,
  singleness: DROPDOWN_KEYS.assessmentSingleness,
  lobito: DROPDOWN_KEYS.lobitoCheckIn,
  assurerWeatherCities: 'assurerWeatherCities',
  rememberEventTypes: 'rememberEventTypes',
  rememberMomentTypes: DROPDOWN_KEYS.momentTypes,
  thiccFittSeason: DROPDOWN_KEYS.roidSeason,
  thiccFittSoreness: 'thiccFittSoreness',
  thiccFittWorkoutDuration: DROPDOWN_KEYS.roidWorkoutDuration,
  thiccFittPrepStatus: 'thiccFittPrepStatus',
  thiccFittExerciseLibrary: 'thiccFittExerciseLibrary',
  thiccFittCardioType: DROPDOWN_KEYS.roidCardioType,
  thiccFittCardioDuration: DROPDOWN_KEYS.roidCardioDuration,
  thiccFittCardioIntensity: 'thiccFittCardioIntensity',
  thiccFittCompound: DROPDOWN_KEYS.roidCompound,
  thiccFittEster: DROPDOWN_KEYS.roidEster,
  thiccFittAmountCc: 'thiccFittAmountCc',
  thiccFittAmountMg: 'thiccFittAmountMg',
  thiccFittSensitivity: DROPDOWN_KEYS.roidSensitivity,
  thiccFittSleepQuality: 'thiccFittSleepQuality',
  thiccFittSoHowYouDoin: 'thiccFittSoHowYouDoin',
  thiccFittWarCryQuotes: 'thiccFittWarCryQuotes',
  itsSex: 'itsSex',
  itsSexualOrientation: 'itsSexualOrientation',
  itsActivityLevel: 'itsActivityLevel',
  itsRelationshipStatus: 'itsRelationshipStatus',
  itsClientColors: 'itsClientColors',
  itsTrainingRest: 'itsTrainingRest',
  itsProgramSplit: 'itsProgramSplit',
  itsVaultCompound: 'itsVaultCompound',
  itsVaultEster: 'itsVaultEster',
  itsVaultAmountCc: 'itsVaultAmountCc',
  itsVaultAmountMg: 'itsVaultAmountMg',
  itsVaultSensitivity: 'itsVaultSensitivity',
  daEaterMealTypes: 'daEaterMealTypes',
  daEaterSupplementTypes: 'daEaterSupplementTypes',
  daEaterSupplementUnits: 'daEaterSupplementUnits',
  daEaterTreatTypes: 'daEaterTreatTypes',
  daEaterTreatDays: 'daEaterTreatDays',
  currentGoalWeight: 'currentGoalWeight',
  height: 'height',
  age: 'age',
  exerciseWeight: 'exerciseWeight',
  exerciseReps: 'exerciseReps',
  exerciseSets: 'exerciseSets',
  exerciseRestSeconds: 'exerciseRestSeconds',
  bodyFat: 'bodyFat',
  worthItPercent: 'worthItPercent',
  yesNo: 'yesNo',
  weekdays: 'weekdays',
  scheduleLayer: 'scheduleLayer',
  recurrenceType: 'recurrenceType',
});

const list = (section, label, values, extra = {}) => ({ section, label, type: 'list', values, editable: true, ...extra });
const numeric = (section, label, min, max, step, unit, extra = {}) => ({ section, label, type: 'numeric', min, max, step, unit, editable: true, ...extra });
const locked = (section, label, values) => ({ section, label, type: 'locked', values, editable: false });

export const CLOCK_IT_REGISTRY = Object.freeze({
  [CLOCK_IT_KEYS.mood]: list('THE.ASSURER', 'MOOD', DEFAULT_DROPDOWNS[DROPDOWN_KEYS.assessmentMood]),
  [CLOCK_IT_KEYS.era]: list('THE.ASSURER', 'ERA', DEFAULT_DROPDOWNS[DROPDOWN_KEYS.assessmentEra]),
  [CLOCK_IT_KEYS.singleness]: list('THE.ASSURER', 'SINGLENESS LEVEL', DEFAULT_DROPDOWNS[DROPDOWN_KEYS.assessmentSingleness]),
  [CLOCK_IT_KEYS.lobito]: list('THE.ASSURER', 'LOBITO CHECK-IN', DEFAULT_DROPDOWNS[DROPDOWN_KEYS.lobitoCheckIn]),
  [CLOCK_IT_KEYS.assurerWeatherCities]: list('THE.ASSURER', 'WEATHER CITIES', ['HOUSTON', 'ATLANTA', 'NEW YORK', 'LOS ANGELES', 'CHICAGO']),

  [CLOCK_IT_KEYS.rememberEventTypes]: list('REMEMBER.ME', 'EVENT TYPES', ['SOMETHING NEW DAY','TREAT DAY','REMINDER','JOB INTERVIEW','BIRTHDAY','ANNIVERSARY','MEETING','DEADLINE','EVENT (WORK)','TRAVEL','CALL','DICK APPOINTMENT','SOCIAL NETWORKING','DATE','HEALTH','RENT','PACKAGE DELIVERY','HAIRCUT']),
  [CLOCK_IT_KEYS.rememberMomentTypes]: list('REMEMBER.ME', 'STANDOUT TYPES', ['WOW', 'WTF', 'PLOT TWIST'], { assetMapped: true }),

  [CLOCK_IT_KEYS.thiccFittSeason]: list('THICC.FITT', 'SEASON / PHASE', DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidSeason]),
  [CLOCK_IT_KEYS.thiccFittSoreness]: list('THICC.FITT', 'SORENESS LEVEL', optionRegistry.thiccFitt.sorenessLevel),
  [CLOCK_IT_KEYS.thiccFittWorkoutDuration]: list('THICC.FITT', 'WORKOUT LENGTH', ['20 MIN','30 MIN','45 MIN','60 MIN','90 MIN','120 MIN']),
  [CLOCK_IT_KEYS.thiccFittPrepStatus]: list('THICC.FITT', 'PREP STATUS', optionRegistry.thiccFitt.prepStatus),
  [CLOCK_IT_KEYS.thiccFittExerciseLibrary]: list('THICC.FITT', 'EXERCISE LIBRARY', ['BENCH PRESS','SQUAT','DEADLIFT','LEG PRESS','HIP THRUST','LAT PULLDOWN','ROW','SHOULDER PRESS','BICEP CURL','TRICEP EXTENSION','LEG CURL','LEG EXTENSION','CALF RAISE']),
  [CLOCK_IT_KEYS.thiccFittCardioType]: list('THICC.FITT', 'CARDIO TYPE', DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidCardioType]),
  [CLOCK_IT_KEYS.thiccFittCardioDuration]: list('THICC.FITT', 'CARDIO DURATION', ['10 MIN','20 MIN','30 MIN','45 MIN','60 MIN','90 MIN','120 MIN']),
  [CLOCK_IT_KEYS.thiccFittCardioIntensity]: list('THICC.FITT', 'CARDIO INTENSITY', ['LOW','MODERATE','HIGH','HIIT','ZONE 2','ALL OUT','RECOVERY']),
  [CLOCK_IT_KEYS.thiccFittCompound]: list('THICC.FITT', 'COMPOUND', DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidCompound]),
  [CLOCK_IT_KEYS.thiccFittEster]: list('THICC.FITT', 'ESTER / FORM', DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidEster]),
  [CLOCK_IT_KEYS.thiccFittAmountCc]: list('THICC.FITT', 'VAULT AMOUNT — CC', ['.5 CC','.75 CC','1 CC','1.25 CC','1.5 CC'], { unit: 'CC' }),
  [CLOCK_IT_KEYS.thiccFittAmountMg]: list('THICC.FITT', 'VAULT AMOUNT — MG', ['50 MG','100 MG','150 MG','200 MG','250 MG','300 MG','400 MG','500 MG'], { unit: 'MG' }),
  [CLOCK_IT_KEYS.thiccFittSensitivity]: list('THICC.FITT', 'SENSITIVITY', DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidSensitivity]),
  [CLOCK_IT_KEYS.thiccFittSleepQuality]: list('THICC.FITT', 'SLEEP QUALITY', ['ROUGH','LIGHT','OKAY','GOOD','DEEP','RESTORATIVE']),
  [CLOCK_IT_KEYS.thiccFittSoHowYouDoin]: list('THICC.FITT', 'SO HOW YOU DOIN', optionRegistry.thiccFitt.soHowYouDoin),
  [CLOCK_IT_KEYS.thiccFittWarCryQuotes]: { section: 'THICC.FITT', label: 'WAR CRY QUOTES', type: 'quotes', values: optionRegistry.thiccFitt.quoteOfDay, editable: true },
  [CLOCK_IT_KEYS.exerciseWeight]: numeric('THICC.FITT', 'EXERCISE WEIGHT', 0, 1000, 5, 'LB', { stepLocked: true }),
  [CLOCK_IT_KEYS.exerciseReps]: numeric('THICC.FITT', 'REPS', 1, 100, 1, 'REP'),
  [CLOCK_IT_KEYS.exerciseSets]: numeric('THICC.FITT', 'SETS', 1, 20, 1, 'SET'),
  [CLOCK_IT_KEYS.exerciseRestSeconds]: numeric('THICC.FITT', 'REST', 0, 600, 15, 'SEC'),
  [CLOCK_IT_KEYS.bodyFat]: numeric('THICC.FITT', 'BODY FAT', 1, 60, 0.1, '%'),

  [CLOCK_IT_KEYS.itsSex]: list('ITS.GETTING.THICC', 'SEX', optionRegistry.itsGettingThicc.sex),
  [CLOCK_IT_KEYS.itsSexualOrientation]: list('ITS.GETTING.THICC', 'SEXUAL ORIENTATION', optionRegistry.itsGettingThicc.sexualOrientation),
  [CLOCK_IT_KEYS.itsActivityLevel]: list('ITS.GETTING.THICC', 'ACTIVITY LEVEL', optionRegistry.itsGettingThicc.activityLevel),
  [CLOCK_IT_KEYS.itsRelationshipStatus]: list('ITS.GETTING.THICC', 'RELATIONSHIP STATUS', optionRegistry.itsGettingThicc.marriedSingle),
  [CLOCK_IT_KEYS.itsClientColors]: { section: 'ITS.GETTING.THICC', label: 'CLIENT COLORS', type: 'colors', values: optionRegistry.itsGettingThicc.clientColors, editable: true },
  [CLOCK_IT_KEYS.itsTrainingRest]: list('ITS.GETTING.THICC', 'TRAINING / REST', ['TRAINING','REST','ACTIVE RECOVERY','OFF']),
  [CLOCK_IT_KEYS.itsProgramSplit]: list('ITS.GETTING.THICC', 'PROGRAM SPLIT', ['FULL BODY','UPPER','LOWER','PUSH','PULL','LEGS','GLUTES','CHEST','BACK','SHOULDERS','ARMS','CARDIO','CONDITIONING','MOBILITY','CUSTOM']),
  [CLOCK_IT_KEYS.itsVaultCompound]: list('ITS.GETTING.THICC', 'VAULT COMPOUND', DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidCompound]),
  [CLOCK_IT_KEYS.itsVaultEster]: list('ITS.GETTING.THICC', 'VAULT ESTER / FORM', DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidEster]),
  [CLOCK_IT_KEYS.itsVaultAmountCc]: list('ITS.GETTING.THICC', 'VAULT AMOUNT — CC', ['.5 CC','.75 CC','1 CC','1.25 CC','1.5 CC'], { unit: 'CC' }),
  [CLOCK_IT_KEYS.itsVaultAmountMg]: list('ITS.GETTING.THICC', 'VAULT AMOUNT — MG', ['50 MG','100 MG','150 MG','200 MG','250 MG','300 MG','400 MG','500 MG'], { unit: 'MG' }),
  [CLOCK_IT_KEYS.itsVaultSensitivity]: list('ITS.GETTING.THICC', 'VAULT SENSITIVITY', DEFAULT_DROPDOWNS[DROPDOWN_KEYS.roidSensitivity]),
  [CLOCK_IT_KEYS.currentGoalWeight]: numeric('ITS.GETTING.THICC', 'CURRENT / GOAL WEIGHT', 120, 400, 1, 'LB', { shared: true }),
  [CLOCK_IT_KEYS.height]: numeric('ITS.GETTING.THICC', 'HEIGHT', 48, 90, 1, 'IN', { display: 'feet-inches' }),
  [CLOCK_IT_KEYS.age]: numeric('ITS.GETTING.THICC', 'AGE', 18, 100, 1, 'YEAR'),

  [CLOCK_IT_KEYS.daEaterMealTypes]: list('DA.EATER', 'MEAL TYPES', ['BREAKFAST','LUNCH','DINNER','SNACK','PRE-WORKOUT','POST-WORKOUT','TREAT','DRINK','WATER','LATE NIGHT','OTHER']),
  [CLOCK_IT_KEYS.daEaterSupplementTypes]: list('DA.EATER', 'SUPPLEMENT TYPES', ['VITAMIN','MINERAL','PROTEIN','CREATINE','ELECTROLYTE','DIGESTIVE','PRE-WORKOUT','POST-WORKOUT','OTHER']),
  [CLOCK_IT_KEYS.daEaterSupplementUnits]: list('DA.EATER', 'SUPPLEMENT UNITS', ['MG','G','MCG','ML','OZ','SCOOP','CAPSULE','TABLET','SERVING','PACKET','DROP']),
  [CLOCK_IT_KEYS.daEaterTreatTypes]: list('DA.EATER', 'TREAT / FLEX TYPES', ['CHEAT MEAL','FLEX MEAL','TREAT','REFEED','DATE NIGHT','SOCIAL MEAL','CELEBRATION','OTHER']),
  [CLOCK_IT_KEYS.daEaterTreatDays]: list('DA.EATER', 'THICC.TREAT DAYS', ['WEDNESDAY','SATURDAY']),
  [CLOCK_IT_KEYS.worthItPercent]: numeric('DA.EATER', 'WORTH IT', 0, 100, 5, '%'),

  [CLOCK_IT_KEYS.yesNo]: locked('LOCKED SYSTEM', 'YES / NO', ['YES','NO']),
  [CLOCK_IT_KEYS.weekdays]: locked('LOCKED SYSTEM', 'WEEKDAYS', ['SUN','MON','TUE','WED','THU','FRI','SAT']),
  [CLOCK_IT_KEYS.scheduleLayer]: locked('LOCKED SYSTEM', 'SCHEDULE LAYER', ['PERSONAL','CLIENT']),
  [CLOCK_IT_KEYS.recurrenceType]: locked('LOCKED SYSTEM', 'RECURRENCE', ['DOES NOT REPEAT','WEEKLY']),
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getClockItDefinition(key) {
  const base = CLOCK_IT_REGISTRY[key];
  if (!base) return null;
  const settings = readSettings();
  const override = settings?.clockItRegistryOverrides?.[key];
  const legacyValues = settings?.optionOverrides?.[key];
  const merged = { ...clone(base), ...(override && typeof override === 'object' ? clone(override) : {}) };
  if (!override?.values && Array.isArray(legacyValues) && legacyValues.length) merged.values = clone(legacyValues);
  return merged;
}

export function getClockItOptions(key) {
  const definition = getClockItDefinition(key);
  return Array.isArray(definition?.values) ? definition.values.filter((entry) => entry?.active !== false) : [];
}

export function getClockItRegistry() {
  return Object.fromEntries(Object.keys(CLOCK_IT_REGISTRY).map((key) => [key, getClockItDefinition(key)]));
}

export function saveClockItDefinition(key, patch) {
  const base = CLOCK_IT_REGISTRY[key];
  if (!base || base.editable === false) return false;
  const settings = readSettings();
  writeSettings({
    ...settings,
    optionOverrides: Array.isArray(patch?.values) && patch.values.every((entry) => typeof entry === 'string')
      ? { ...(settings.optionOverrides || {}), [key]: clone(patch.values) }
      : (settings.optionOverrides || {}),
    clockItRegistryOverrides: {
      ...(settings.clockItRegistryOverrides || {}),
      [key]: { ...(settings.clockItRegistryOverrides?.[key] || {}), ...clone(patch) },
    },
  });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CLOCK_IT_CHANGED_EVENT, { detail: { key } }));
  return true;
}

export function resetClockItDefinition(key) {
  const settings = readSettings();
  const overrides = { ...(settings.clockItRegistryOverrides || {}) };
  delete overrides[key];
  const baseValues = CLOCK_IT_REGISTRY[key]?.values;
  writeSettings({
    ...settings,
    optionOverrides: Array.isArray(baseValues) && baseValues.every((entry) => typeof entry === 'string')
      ? { ...(settings.optionOverrides || {}), [key]: clone(baseValues) }
      : (settings.optionOverrides || {}),
    clockItRegistryOverrides: overrides,
    replaceClockItRegistryOverrides: true,
  });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CLOCK_IT_CHANGED_EVENT, { detail: { key } }));
}

export function numericOptions(key) {
  const definition = getClockItDefinition(key);
  if (!definition || definition.type !== 'numeric') return [];
  const values = [];
  for (let value = Number(definition.min); value <= Number(definition.max) + 1e-9; value += Number(definition.step)) {
    const safe = Number(value.toFixed(4));
    values.push({
      value: String(safe),
      label: definition.display === 'feet-inches'
        ? `${Math.floor(safe / 12)} FT ${safe % 12} IN`
        : `${safe}${definition.unit ? ` ${definition.unit}` : ''}`,
    });
  }
  return values;
}

export function useClockItDefinition(key) {
  const [definition, setDefinition] = useState(() => getClockItDefinition(key));
  useEffect(() => {
    const refresh = (event) => {
      if (!event?.detail?.key || event.detail.key === key) setDefinition(getClockItDefinition(key));
    };
    refresh();
    window.addEventListener(CLOCK_IT_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('truthinstyle-cloud-state-hydrated', refresh);
    return () => {
      window.removeEventListener(CLOCK_IT_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('truthinstyle-cloud-state-hydrated', refresh);
    };
  }, [key]);
  return definition;
}

export function useClockItOptions(key) {
  const definition = useClockItDefinition(key);
  return Array.isArray(definition?.values) ? definition.values.filter((entry) => entry?.active !== false) : [];
}

export function useClockItNumericOptions(key) {
  const definition = useClockItDefinition(key);
  if (definition?.type !== 'numeric') return [];
  const values = [];
  for (let value = Number(definition.min); value <= Number(definition.max) + 1e-9; value += Number(definition.step)) {
    const safe = Number(value.toFixed(4));
    values.push({
      value: String(safe),
      label: definition.display === 'feet-inches'
        ? `${Math.floor(safe / 12)} FT ${safe % 12} IN`
        : `${safe}${definition.unit ? ` ${definition.unit}` : ''}`,
    });
  }
  return values;
}
