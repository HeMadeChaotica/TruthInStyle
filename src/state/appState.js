import { day_state, source_inputs } from '../data/scaffoldData.js';

const listeners = new Set();

export const appState = {
  route: '/',
  controlPanelOpen: false,
  activeDay: { ...day_state },
  ui: {
    versionId: 'v1',
    thiccDossiers: [{ id: 'thicc-info-1', label: 'THICC.INFO' }]
  }
};

function ensureDayBucket(scope, fallback = {}) {
  if (!source_inputs[scope][appState.activeDay.activeDate]) {
    source_inputs[scope][appState.activeDay.activeDate] = { ...fallback };
  }
  return source_inputs[scope][appState.activeDay.activeDate];
}

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

export function updateAssurerAssessmentField(fieldKey, value) {
  const target = ensureDayBucket('assurer_assessment');
  target[fieldKey] = value;
  notify();
}

export function updateAssurerWriterField(fieldKey, value) {
  const target = ensureDayBucket('assurer_writer', { heresTheThing: '' });
  target[fieldKey] = value;
  notify();
}

export function addThiccDossierTemplate() {
  const nextIndex = appState.ui.thiccDossiers.length + 1;
  appState.ui.thiccDossiers.push({ id: `thicc-info-${nextIndex}`, label: `THICC.INFO ${nextIndex}` });
  notify();
}

export function renameThiccDossier(id, clientName) {
  const target = appState.ui.thiccDossiers.find((dossier) => dossier.id === id);
  if (!target) return;
  target.label = clientName?.trim() ? `${clientName.trim().toUpperCase()} FILE` : target.label;
  notify();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener(appState));
}
