import { BATTLE_CRY_QUOTES } from './battleCryQuoteData.js';

function getSafeDate(date) {
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date;
  }

  if (typeof date === 'string') {
    const dateOnlyMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }

  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? new Date(1970, 0, 1) : parsedDate;
}

function getLocalDayNumber(date) {
  const safeDate = getSafeDate(date);
  return Math.floor(Date.UTC(
    safeDate.getFullYear(),
    safeDate.getMonth(),
    safeDate.getDate(),
  ) / 86400000);
}

export { BATTLE_CRY_QUOTES };

export function getBattleCryForDate(date = new Date()) {
  if (!BATTLE_CRY_QUOTES.length) {
    return null;
  }

  return BATTLE_CRY_QUOTES[getLocalDayNumber(date) % BATTLE_CRY_QUOTES.length];
}

export function getBattleCryById(id) {
  return BATTLE_CRY_QUOTES.find((quote) => quote.id === id) || BATTLE_CRY_QUOTES[0] || null;
}
