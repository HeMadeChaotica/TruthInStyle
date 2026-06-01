export function getLocalDateKey(date = new Date()) {
  const localDate = date instanceof Date ? date : new Date(date);
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${localDate.getFullYear()}-${month}-${day}`;
}

export function getUtcIsoDateKey(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

export function getDailyDateKeyCandidates(date = new Date()) {
  const localDateKey = getLocalDateKey(date);
  const utcDateKey = getUtcIsoDateKey(date);
  return localDateKey === utcDateKey ? [localDateKey] : [localDateKey, utcDateKey];
}
