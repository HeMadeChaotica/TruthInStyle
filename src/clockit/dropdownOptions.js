const DEFAULT_DROPDOWNS = {
  assessmentMood: ['FOCUSED', 'UNSTEADY', 'LIT', 'TENDER', 'FEROCIOUS'],
  assessmentEra: ['REBUILD', 'EXPANSION', 'RECOVERY', 'CHAOS', 'GLOW-UP'],
  assessmentSingleness: ['SINGLE', 'DATING', 'SEEING SOMEONE', 'COMPLICATED'],
  lobitoCheckIn: ['QUIET', 'FLIRTY', 'HUNGRY', 'WILD'],
  psTypes: ['REMINDER', 'ANCHOR', 'MICRO-NOTE'],
  momentTypes: ['WOW', 'WTF', 'PLOT TWIST'],
  roidSeason: ['CRUISE', 'BLAST', 'BRIDGE', 'OFF'],
  roidWorkoutDuration: ['20M', '40M', '60M', '90M+'],
  roidCardioType: ['WALK', 'RUN', 'CYCLE', 'STAIR'],
  roidCardioDuration: ['10M', '20M', '30M', '45M+'],
  roidCompound: ['TESTOSTERONE', 'NANDROLONE', 'PRIMOBOLAN', 'MASTERON'],
  roidEster: ['ENANTHATE', 'CYPIONATE', 'PROPIONATE', 'ACETATE'],
  roidAmount: ['LOW', 'MEDIUM', 'HIGH'],
  roidSensitivity: ['LOW', 'MODERATE', 'HIGH']
};

const overrides = new Map();
const listeners = new Set();

export const OPTION_SET_FAMILY_KEYS = Object.keys(DEFAULT_DROPDOWNS);

export function setOptionOverride(familyKey, options) {
  if (!DEFAULT_DROPDOWNS[familyKey]) return;
  overrides.set(familyKey, [...options]);
  emitDropdownChanged(familyKey);
}

export function clearOptionOverride(familyKey) {
  if (overrides.delete(familyKey)) emitDropdownChanged(familyKey);
}

export function getOptionsForFamily(familyKey) {
  return overrides.get(familyKey) ?? DEFAULT_DROPDOWNS[familyKey] ?? [];
}

export function onDropdownOptionsChanged(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitDropdownChanged(familyKey) {
  listeners.forEach((listener) => listener({ familyKey, values: getOptionsForFamily(familyKey) }));
}

export function getClockItRegistrySnapshot() {
  return OPTION_SET_FAMILY_KEYS.map((familyKey) => ({
    familyKey,
    values: getOptionsForFamily(familyKey),
    hasOverride: overrides.has(familyKey)
  }));
}
