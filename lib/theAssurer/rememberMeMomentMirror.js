const REMEMBER_ME_MOMENTS_STORAGE_KEY = 'remember_me_standout_moments_v1';

export const EMPTY_REMEMBER_ME_MOMENT_MIRROR = {
  wow: null,
  wtf: null,
  plotTwist: null,
};

export const REMEMBER_ME_MOMENT_TYPES = [
  { key: 'wow', label: 'WOW' },
  { key: 'wtf', label: 'WTF' },
  { key: 'plotTwist', label: 'PLOT TWIST' },
];

export function getRememberMeMomentDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
}

function normalizeMomentType(value) {
  const nextValue = String(value || '').trim().toUpperCase();

  if (nextValue === 'WOW') return 'wow';
  if (nextValue === 'WTF') return 'wtf';
  if (nextValue === 'PLOT TWIST') return 'plotTwist';

  return null;
}

function getMomentText(moment) {
  return String(moment?.description || moment?.detail || '').trim();
}

function getMomentMedia(moment) {
  return String(moment?.persistedMediaRef || moment?.photoRef || moment?.mediaRef || '').trim();
}

function getMomentTimestamp(moment, fallbackDateKey) {
  const stampedAt = moment?.stampedAt || moment?.createdAt || moment?.updatedAt || '';
  const timestamp = stampedAt ? Date.parse(stampedAt) : Number.NaN;

  if (!Number.isNaN(timestamp)) {
    return timestamp;
  }

  if (moment?.time) {
    const timed = Date.parse(`${fallbackDateKey}T${moment.time}`);
    if (!Number.isNaN(timed)) {
      return timed;
    }
  }

  return 0;
}

function normalizeMoment(moment, fallbackDateKey) {
  if (!moment || typeof moment !== 'object') {
    return null;
  }

  const typeKey = normalizeMomentType(moment.type || moment.standoutType);
  const typeMeta = REMEMBER_ME_MOMENT_TYPES.find((type) => type.key === typeKey);

  if (!typeKey || !typeMeta) {
    return null;
  }

  return {
    id: String(moment.id || `${typeKey}-${fallbackDateKey}`),
    type: typeMeta.label,
    typeKey,
    dateKey: fallbackDateKey,
    time: String(moment.time || '').trim(),
    detail: String(moment.detail || '').trim(),
    description: String(moment.description || '').trim(),
    text: getMomentText(moment),
    mediaRef: getMomentMedia(moment),
    timestamp: getMomentTimestamp(moment, fallbackDateKey),
  };
}

export function readRememberMeMomentMirror(dateKey) {
  if (typeof window === 'undefined' || !dateKey) {
    return { ...EMPTY_REMEMBER_ME_MOMENT_MIRROR };
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(REMEMBER_ME_MOMENTS_STORAGE_KEY) || '{}');
    const dayMoments = Array.isArray(parsed?.[dateKey]) ? parsed[dateKey] : [];

    return dayMoments.reduce((mirror, moment) => {
      const normalizedMoment = normalizeMoment(moment, dateKey);
      if (!normalizedMoment) {
        return mirror;
      }

      const currentMoment = mirror[normalizedMoment.typeKey];
      if (!currentMoment || normalizedMoment.timestamp >= currentMoment.timestamp) {
        return {
          ...mirror,
          [normalizedMoment.typeKey]: normalizedMoment,
        };
      }

      return mirror;
    }, { ...EMPTY_REMEMBER_ME_MOMENT_MIRROR });
  } catch (error) {
    console.warn('THE.ASSURER REMEMBER.ME moment mirror read failed', error);
    return { ...EMPTY_REMEMBER_ME_MOMENT_MIRROR };
  }
}
