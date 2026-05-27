const SETTINGS_KEY = 'chaotica:settings';

export function readSettings() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeSettings(nextSettings) {
  if (typeof window === 'undefined') return;
  const current = readSettings();
  const merged = {
    ...current,
    ...nextSettings,
    optionOverrides: {
      ...(current.optionOverrides || {}),
      ...(nextSettings?.optionOverrides || {})
    }
  };
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
}
