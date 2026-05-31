const DA_EATER_DAYS_STORAGE_KEY = 'truthinstyle_da_eater_days_v1';

export const EMPTY_DA_EATER_MEAL_LOG = [];

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const safeString = (value) => (value === undefined || value === null ? '' : String(value).trim());

const pickFirstString = (...values) => values.map(safeString).find(Boolean) || '';

const normalizeNumberText = (value) => {
  const text = safeString(value);
  if (!text) return '0';
  const number = Number(text);
  return Number.isFinite(number) ? String(number) : text;
};

const normalizeTime = (value) => {
  const text = safeString(value);
  if (!text) return 'TIME NOT SET';
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return text.toUpperCase();

  const hour = Number(match[1]);
  const minute = match[2];
  if (!Number.isFinite(hour)) return text.toUpperCase();

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
};

const normalizeThumb = (meal) => {
  const candidate = meal.thumbnail || meal.thumb || meal.image || meal.imageUrl || meal.photoUrl || meal.photoRef || meal.media;
  if (!candidate) return '';
  const rawValue = typeof candidate === 'string'
    ? candidate
    : (isObject(candidate) ? pickFirstString(candidate.url, candidate.src, candidate.previewUrl) : '');
  const thumb = safeString(rawValue);
  if (!thumb || thumb.startsWith('blob:')) return '';
  return /^(https?:|data:image\/|\/)/i.test(thumb) ? thumb : '';
};

const mealSortValue = (meal) => {
  const rawTime = safeString(meal.rawTime || meal.time);
  const match = rawTime.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
};

export const normalizeDaEaterMeal = (meal, index = 0) => {
  const safeMeal = isObject(meal) ? meal : {};
  const type = pickFirstString(safeMeal.type, safeMeal.mealType, safeMeal.meal_type, safeMeal.category, 'MEAL');
  const name = pickFirstString(safeMeal.name, safeMeal.mealName, safeMeal.title, safeMeal.meal, 'UNTITLED');
  const protein = normalizeNumberText(safeMeal.protein);
  const carbs = normalizeNumberText(safeMeal.carbs);
  const fats = normalizeNumberText(safeMeal.fats);
  const calories = normalizeNumberText(safeMeal.calories || safeMeal.kcal);
  const waterOz = normalizeNumberText(safeMeal.waterOz || safeMeal.water);
  const isWater = type.toUpperCase() === 'WATER';

  return {
    id: pickFirstString(safeMeal.id, safeMeal.uuid, `${type}-${name}-${index}`),
    rawTime: safeString(safeMeal.time),
    time: normalizeTime(safeMeal.time),
    type: type.toUpperCase(),
    name: name.toUpperCase(),
    protein,
    carbs,
    fats,
    calories,
    waterOz,
    macroText: isWater ? `WATER ${waterOz}OZ` : `${protein}P / ${carbs}C / ${fats}F / ${calories}`,
    thumbnail: normalizeThumb(safeMeal),
    status: pickFirstString(safeMeal.status, safeMeal.checkStatus, safeMeal.checkmark),
    completed: Boolean(safeMeal.completed || safeMeal.checked || safeMeal.done),
  };
};

export const readDaEaterMealLogForDate = (date) => {
  if (typeof window === 'undefined') return EMPTY_DA_EATER_MEAL_LOG;

  try {
    const rawDays = window.localStorage.getItem(DA_EATER_DAYS_STORAGE_KEY);
    if (!rawDays) return EMPTY_DA_EATER_MEAL_LOG;

    const days = JSON.parse(rawDays);
    const day = isObject(days) ? days[date] : null;
    const meals = Array.isArray(day?.meals) ? day.meals : EMPTY_DA_EATER_MEAL_LOG;

    return meals
      .map(normalizeDaEaterMeal)
      .sort((left, right) => mealSortValue(left) - mealSortValue(right));
  } catch {
    return EMPTY_DA_EATER_MEAL_LOG;
  }
};
