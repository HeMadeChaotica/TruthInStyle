'use client';

import {
  buildRolloverCalendarEntries,
  createDefaultSchoolState,
  normalizeSchoolState,
  recordPracticeAttempt,
  rollForwardMissedSections,
  setSectionCompletion,
  summarizeSchoolState,
  updateSectionDetails,
} from '../../lib/thiccSchool/schoolEngine.mjs';
import {
  deleteRememberMeLocal,
  loadLocalEntries,
  upsertRememberMeLocal,
} from './rememberMeService';

const STORAGE_KEY = 'thicc_school_state_v1';
const UPDATED_EVENT = 'truthinstyle-thicc-school-updated';

const todayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const emitUpdate = (detail = {}) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(UPDATED_EVENT, { detail }));
};

export function readThiccSchoolState() {
  if (typeof window === 'undefined') return createDefaultSchoolState();
  try {
    return normalizeSchoolState(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null'));
  } catch {
    return createDefaultSchoolState();
  }
}

export function saveThiccSchoolState(value, detail = {}) {
  const state = normalizeSchoolState(value);
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  emitUpdate(detail);
  return state;
}

export function reconcileThiccSchoolCalendar(stateValue, currentDate = todayKey()) {
  if (typeof window === 'undefined') return [];
  const desired = buildRolloverCalendarEntries(stateValue);
  const desiredIds = new Set(desired.map((entry) => entry.id));
  desired.forEach((entry) => upsertRememberMeLocal(entry));
  loadLocalEntries()
    .filter((entry) => String(entry.id || '').startsWith('thicc-school-rollover-'))
    .filter((entry) => !desiredIds.has(entry.id) && entry.date_key >= currentDate)
    .forEach((entry) => deleteRememberMeLocal(entry.id));
  return desired;
}

export function initializeThiccSchool(currentDate = todayKey()) {
  const existing = readThiccSchoolState();
  const { state, moved } = rollForwardMissedSections(existing, currentDate);
  saveThiccSchoolState(state, { reason: 'initialize', moved });
  reconcileThiccSchoolCalendar(state, currentDate);
  return { state, moved };
}

export function markThiccSchoolSection(courseId, sectionId, complete) {
  const state = setSectionCompletion(readThiccSchoolState(), courseId, sectionId, complete);
  saveThiccSchoolState(state, { reason: 'section', courseId, sectionId, complete });
  reconcileThiccSchoolCalendar(state);
  return state;
}

export function editThiccSchoolSection(courseId, sectionId, updates) {
  const state = updateSectionDetails(readThiccSchoolState(), courseId, sectionId, updates);
  saveThiccSchoolState(state, { reason: 'edit', courseId, sectionId });
  reconcileThiccSchoolCalendar(state);
  return state;
}

export function submitThiccSchoolPractice(courseId, questions, answers) {
  const { state, result } = recordPracticeAttempt(readThiccSchoolState(), courseId, questions, answers);
  saveThiccSchoolState(state, { reason: 'practice', courseId, score: result.score });
  return { state, result };
}

export function getThiccSchoolSummary(value = readThiccSchoolState()) {
  return summarizeSchoolState(value);
}

export const THICC_SCHOOL_UPDATED_EVENT = UPDATED_EVENT;
