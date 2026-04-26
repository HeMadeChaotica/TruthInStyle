import { day_state } from '../data/scaffoldData.js';

const listeners = new Set();

export const appState = {
  route: '/',
  controlPanelOpen: false,
  activeDay: { ...day_state },
  ui: { versionId: 'v1' }
};

export function setRoute(route) {
  appState.route = route;
  appState.controlPanelOpen = false;
  notify();
}

export function toggleControlPanel() {
  appState.controlPanelOpen = !appState.controlPanelOpen;
  notify();
}

export function setActiveDay(nextDateMMDDYYYY) {
  const parts = nextDateMMDDYYYY.split('/');
  const asDate = new Date(Date.UTC(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1])));
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(asDate).toUpperCase();
  appState.activeDay.activeDate = nextDateMMDDYYYY;
  appState.activeDay.activeWeekday = weekday;
  notify();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener(appState));
}
