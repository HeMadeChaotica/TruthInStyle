export const normalizeUserText = (value) => (typeof value === 'string' ? value.toUpperCase() : value);

export const normalizeObjectStrings = (input) => {
  if (Array.isArray(input)) return input.map(normalizeObjectStrings);
  if (!input || typeof input !== 'object') return normalizeUserText(input);
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, normalizeObjectStrings(value)]));
};
