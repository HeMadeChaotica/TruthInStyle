import { calculateDaEaterTotals, getDaEaterDay } from '../../src/services/daEaterService';

export const ASSURER_MACRO_FALLBACK_ROWS = [
  { key: 'protein', glyph: 'P', label: 'PROTEIN', compactLabel: 'PROTEIN', target: 250, current: 0, unit: 'G' },
  { key: 'carbs', glyph: 'C', label: 'CARBS', compactLabel: 'CARBS', target: 300, current: 0, unit: 'G' },
  { key: 'fats', glyph: 'F', label: 'FATS', compactLabel: 'FATS', target: 80, current: 0, unit: 'G' },
  { key: 'calories', glyph: 'K', label: 'CALORIES', compactLabel: 'CAL', target: 2400, current: 0, unit: '' },
  { key: 'waterOz', glyph: 'W', label: 'WATER', compactLabel: 'WATER', target: 3.5, current: 0, unit: 'L' },
];

export const ASSURER_MACRO_FALLBACK_MIRROR = {
  source: 'DA.EATER FALLBACK',
  isFallback: true,
  rows: ASSURER_MACRO_FALLBACK_ROWS.map((row) => ({
    ...row,
    percent: 0,
    left: row.target,
    targetDisplay: `${row.target}${row.unit}`,
    leftDisplay: `${row.target}${row.unit} LEFT`,
  })),
};

const DA_EATER_MACRO_CONFIG = [
  { key: 'protein', glyph: 'P', label: 'PROTEIN', compactLabel: 'PROTEIN', unit: 'G' },
  { key: 'carbs', glyph: 'C', label: 'CARBS', compactLabel: 'CARBS', unit: 'G' },
  { key: 'fats', glyph: 'F', label: 'FATS', compactLabel: 'FATS', unit: 'G' },
  { key: 'calories', glyph: 'K', label: 'CALORIES', compactLabel: 'CAL', unit: 'CAL' },
  { key: 'waterOz', glyph: 'W', label: 'WATER', compactLabel: 'WATER', unit: 'OZ' },
];

const todayStorageDate = () => new Date().toISOString().slice(0, 10);

const cleanNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

const formatAmount = (value, unit) => `${cleanNumber(value).toFixed(0)}${unit}`;

export function readDaEaterMacroMirror(date = todayStorageDate()) {
  if (typeof window === 'undefined') {
    return ASSURER_MACRO_FALLBACK_MIRROR;
  }

  try {
    const day = getDaEaterDay(date);
    const { totals, targets, progress } = calculateDaEaterTotals(day);

    return {
      source: 'DA.EATER',
      isFallback: false,
      date,
      rows: DA_EATER_MACRO_CONFIG.map((item) => {
        const target = cleanNumber(targets[item.key]);
        const current = cleanNumber(totals[item.key]);
        const percent = cleanNumber(progress[item.key]);
        const left = Math.max(target - current, 0);

        return {
          ...item,
          target,
          current,
          percent,
          left,
          targetDisplay: formatAmount(target, item.unit),
          leftDisplay: `${formatAmount(left, item.unit)} LEFT`,
        };
      }),
    };
  } catch {
    return ASSURER_MACRO_FALLBACK_MIRROR;
  }
}
