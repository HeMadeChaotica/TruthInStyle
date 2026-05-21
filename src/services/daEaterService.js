const STORAGE_KEY = 'truthinstyle_da_eater_days_v1';

export const DEFAULT_DA_EATER_MACRO_TARGETS = {
  protein: 250,
  carbs: 120,
  fats: 75,
  waterOz: 128,
  calories: 4500
};

const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const formatDisplayDate = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.includes('-')) {
    const [year, month, day] = value.split('-');
    return `${month}/${day}/${year}`;
  }
  const next = new Date(value);
  if (Number.isNaN(next.getTime())) return '';
  const month = String(next.getMonth() + 1).padStart(2, '0');
  const day = String(next.getDate()).padStart(2, '0');
  const year = next.getFullYear();
  return `${month}/${day}/${year}`;
};


const sanitizePhotoRef = (photoRef) => {
  if (!photoRef) return '';
  if (typeof photoRef === 'string') {
    return photoRef.startsWith('blob:') ? '' : photoRef;
  }
  if (typeof photoRef !== 'object') return '';
  const candidate = { ...photoRef };
  if (typeof candidate.url === 'string' && candidate.url.startsWith('blob:')) delete candidate.url;
  if (typeof candidate.previewUrl === 'string' && candidate.previewUrl.startsWith('blob:')) delete candidate.previewUrl;
  if (typeof candidate.objectUrl === 'string' && candidate.objectUrl.startsWith('blob:')) delete candidate.objectUrl;
  return candidate;
};

const emptyDay = (date) => ({
  source: 'da_eater_day',
  date,
  waterOz: 0,
  meals: [],
  supplements: [],
  cravings: [],
  cheatFlexEntries: [],
  hyperFixationMeal: { mealName: '', currentFixation: '', weeklyCount: '', notes: '', macroEstimate: '' },
  photoLog: [{ slot: 1, photoRef: '', description: '' }, { slot: 2, photoRef: '', description: '' }]
});

export function readDaEaterDays() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('DA.EATER localStorage parse failed', error);
    return {};
  }
}

export function saveDaEaterDays(days) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(days || {}));
}

export function getDaEaterDay(date) {
  const days = readDaEaterDays();
  const merged = { ...emptyDay(date), ...(days[date] || {}) };
  merged.photoLog = (merged.photoLog || emptyDay(date).photoLog).map((entry, index) => ({
    slot: entry.slot || index + 1,
    photoRef: sanitizePhotoRef(entry.photoRef),
    description: entry.description || entry.mealTag || ''
  }));
  return merged;
}

export function saveDaEaterDay(dayPayload) {
  if (!dayPayload?.date) return null;
  const days = readDaEaterDays();
  const next = { ...emptyDay(dayPayload.date), ...dayPayload, source: 'da_eater_day' };
  days[dayPayload.date] = next;
  saveDaEaterDays(days);
  return next;
}

const upsertInList = (list, value, prefix) => {
  const id = value.id || createId(prefix);
  const existing = list.findIndex((x) => x.id === id);
  if (existing >= 0) return list.map((x, i) => (i === existing ? { ...x, ...value, id } : x));
  return [...list, { ...value, id }];
};

const deleteFromList = (list, id) => list.filter((x) => x.id !== id);

export function upsertMealEntry(date, meal) {
  const day = getDaEaterDay(date);
  day.meals = upsertInList(day.meals || [], meal, 'meal');
  return saveDaEaterDay(day);
}
export function deleteMealEntry(date, mealId) {
  const day = getDaEaterDay(date);
  day.meals = deleteFromList(day.meals || [], mealId);
  return saveDaEaterDay(day);
}
export function upsertSupplementEntry(date, supplement) {
  const day = getDaEaterDay(date);
  day.supplements = upsertInList(day.supplements || [], supplement, 'supp');
  return saveDaEaterDay(day);
}
export function deleteSupplementEntry(date, supplementId) {
  const day = getDaEaterDay(date);
  day.supplements = deleteFromList(day.supplements || [], supplementId);
  return saveDaEaterDay(day);
}
export function upsertCravingEntry(date, craving) {
  const day = getDaEaterDay(date);
  day.cravings = upsertInList(day.cravings || [], craving, 'crave');
  return saveDaEaterDay(day);
}
export function deleteCravingEntry(date, cravingId) {
  const day = getDaEaterDay(date);
  day.cravings = deleteFromList(day.cravings || [], cravingId);
  return saveDaEaterDay(day);
}
export function upsertCheatFlexEntry(date, entry) {
  const day = getDaEaterDay(date);
  day.cheatFlexEntries = upsertInList(day.cheatFlexEntries || [], entry, 'cheat');
  return saveDaEaterDay(day);
}
export function deleteCheatFlexEntry(date, entryId) {
  const day = getDaEaterDay(date);
  day.cheatFlexEntries = deleteFromList(day.cheatFlexEntries || [], entryId);
  return saveDaEaterDay(day);
}

export function getDaEaterMacroTargets() {
  return DEFAULT_DA_EATER_MACRO_TARGETS;
}

export function calculateDaEaterTotals(dayPayload) {
  const meals = dayPayload?.meals || [];
  const cheatCals = (dayPayload?.cheatFlexEntries || []).reduce((sum, x) => sum + Number(x.roughCalories || 0), 0);
  const totals = meals.reduce((acc, meal) => ({
    protein: acc.protein + Number(meal.protein || 0),
    carbs: acc.carbs + Number(meal.carbs || 0),
    fats: acc.fats + Number(meal.fats || 0),
    calories: acc.calories + Number(meal.calories || 0),
    waterOz: acc.waterOz + Number(meal.type === 'WATER' ? (meal.waterOz || 0) : 0)
  }), { protein: 0, carbs: 0, fats: 0, calories: 0, waterOz: 0 });
  totals.calories += cheatCals;
  totals.waterOz += Number(dayPayload?.waterOz || 0);
  const targets = getDaEaterMacroTargets();
  const progress = {
    protein: (totals.protein / targets.protein) * 100,
    carbs: (totals.carbs / targets.carbs) * 100,
    fats: (totals.fats / targets.fats) * 100,
    calories: (totals.calories / targets.calories) * 100,
    waterOz: (totals.waterOz / targets.waterOz) * 100
  };
  return { totals, targets, progress };
}

export function prepareDaEaterAssurerPayload(dayData) {
  const date = dayData?.date || new Date().toISOString().slice(0, 10);
  const dayPayload = dayData || {};
  const safeDay = { ...emptyDay(date), ...(dayPayload || {}) };
  const { totals, targets, progress } = calculateDaEaterTotals(safeDay);
  const dayName = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  return {
    source: 'DA.EATER',
    date,
    displayDate: formatDisplayDate(date),
    macroTargets: targets,
    macroTotals: totals,
    macroProgress: progress,
    mealLog: safeDay.meals,
    dailyIntakeSummary: {
      mealCount: safeDay.meals.length,
      supplementCount: safeDay.supplements.length,
      cravingCount: safeDay.cravings.length,
      cheatFlexCount: safeDay.cheatFlexEntries.length,
      mealList: safeDay.meals.map((m) => ({ name: m.name, time: m.time, protein: m.protein, carbs: m.carbs, fats: m.fats, calories: m.calories }))
    },
    signals: {
      proteinProgress: progress.protein,
      carbsProgress: progress.carbs,
      fatsProgress: progress.fats,
      caloriesProgress: progress.calories,
      waterProgress: progress.waterOz,
      mealCount: safeDay.meals.length,
      defaultCheatDay: dayName === 'WEDNESDAY' || dayName === 'SATURDAY',
      cheatFlexLogged: safeDay.cheatFlexEntries.length > 0,
      hyperFixationMeal: safeDay.hyperFixationMeal,
      cravingCount: safeDay.cravings.length
    }
  };
}


export const buildDaEaterAssurerPayload = (date, dayPayload) => prepareDaEaterAssurerPayload({ date, ...(dayPayload || {}) });
