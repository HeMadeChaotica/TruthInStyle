'use client';

import { normalizeSchoolState, summarizeSchoolState } from '../../lib/thiccSchool/schoolEngine.mjs';

export const THICC_FITT_LLC_BUILD_STORAGE_KEY = 'truthinstyle_thicc_fitt_llc_build_v1';
export const THICC_FITT_LLC_BUILD_UPDATED_EVENT = 'truthinstyle-thicc-fitt-llc-build-updated';
export const THICC_FITT_LLC_BUILD_SCHEMA_VERSION = 1;

export const THICC_FITT_LLC_BUILD_CATEGORIES = [
  'FORMATION & COMPLIANCE',
  'CERTIFICATION & EDUCATION',
  'BRAND & WEBSITE',
  'SYSTEMS & OPERATIONS',
  'CLIENT & SERVICE READINESS',
];

const DEFAULT_MILESTONES = [
  {
    id: 'llc-filing-payment',
    category: 'FORMATION & COMPLIANCE',
    title: 'FILE AND PAY FOR THICC.FITT LLC',
    targetDate: '2026-11-23',
    status: 'planned',
    completedAt: '',
    blockedBy: '',
    nextAction: 'SUBMIT THE LLC FORMATION FILING AND PAY THE REQUIRED STATE FEE.',
  },
  {
    id: 'ein',
    category: 'FORMATION & COMPLIANCE',
    title: 'OBTAIN EIN',
    targetDate: '',
    status: 'planned',
    completedAt: '',
    blockedBy: 'LLC FILING',
    nextAction: 'APPLY FOR THE EIN AFTER THE LLC FILING IS ACCEPTED.',
  },
  {
    id: 'operating-agreement',
    category: 'FORMATION & COMPLIANCE',
    title: 'COMPLETE OPERATING AGREEMENT',
    targetDate: '',
    status: 'planned',
    completedAt: '',
    blockedBy: 'LLC FILING',
    nextAction: 'FINALIZE THE COMPANY OPERATING AGREEMENT.',
  },
  {
    id: 'business-banking',
    category: 'SYSTEMS & OPERATIONS',
    title: 'OPEN BUSINESS BANKING',
    targetDate: '',
    status: 'planned',
    completedAt: '',
    blockedBy: 'EIN',
    nextAction: 'OPEN THE BUSINESS ACCOUNT AFTER THE EIN IS ISSUED.',
  },
  {
    id: 'insurance-readiness',
    category: 'CLIENT & SERVICE READINESS',
    title: 'CONFIRM TRAINER INSURANCE AND CLIENT PROTECTION',
    targetDate: '',
    status: 'planned',
    completedAt: '',
    blockedBy: '',
    nextAction: 'COMPARE COVERAGE AND CONFIRM THE REQUIRED POLICY.',
  },
];

const cleanText = (value) => String(value ?? '').trim();
const cleanDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(cleanText(value)) ? cleanText(value) : '';
const cleanMinutes = (value) => Math.max(0, Math.round(Number(value) || 0));
const copy = (value) => JSON.parse(JSON.stringify(value));

function readStorageJson(key, fallback) {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function todayKey(value = new Date()) {
  if (typeof value === 'string' && cleanDate(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function defaultState() {
  return {
    schemaVersion: THICC_FITT_LLC_BUILD_SCHEMA_VERSION,
    companyName: 'THICC.FITT LLC',
    milestones: copy(DEFAULT_MILESTONES),
    workLog: [],
    updatedAt: new Date(0).toISOString(),
  };
}

function normalizeMilestone(value = {}, fallback = {}) {
  const status = ['planned', 'in_progress', 'blocked', 'complete'].includes(value.status) ? value.status : (fallback.status || 'planned');
  return {
    id: cleanText(value.id || fallback.id) || `milestone-${Date.now()}`,
    category: THICC_FITT_LLC_BUILD_CATEGORIES.includes(value.category) ? value.category : (fallback.category || THICC_FITT_LLC_BUILD_CATEGORIES[0]),
    title: cleanText(value.title || fallback.title) || 'UNTITLED BUSINESS MILESTONE',
    targetDate: cleanDate(value.targetDate || fallback.targetDate),
    status,
    completedAt: status === 'complete' ? cleanText(value.completedAt || fallback.completedAt || new Date().toISOString()) : '',
    blockedBy: cleanText(value.blockedBy || fallback.blockedBy),
    nextAction: cleanText(value.nextAction || fallback.nextAction),
  };
}

function normalizeWorkEntry(value = {}) {
  const status = ['planned', 'in_progress', 'blocked', 'complete'].includes(value.status) ? value.status : 'complete';
  return {
    id: cleanText(value.id) || `llc-work-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: cleanDate(value.date) || todayKey(),
    category: THICC_FITT_LLC_BUILD_CATEGORIES.includes(value.category) ? value.category : THICC_FITT_LLC_BUILD_CATEGORIES[3],
    title: cleanText(value.title) || 'THICC.FITT LLC BUILD WORK',
    minutes: cleanMinutes(value.minutes),
    status,
    notes: cleanText(value.notes).slice(0, 1500),
    createdAt: cleanText(value.createdAt) || new Date().toISOString(),
  };
}

export function normalizeThiccFittLlcBuildState(value) {
  const base = defaultState();
  const incoming = value && typeof value === 'object' ? value : {};
  const incomingMilestones = Array.isArray(incoming.milestones) ? incoming.milestones : [];
  const byId = new Map(incomingMilestones.map((item) => [cleanText(item?.id), item]));
  const defaults = base.milestones.map((item) => normalizeMilestone(byId.get(item.id) || item, item));
  const custom = incomingMilestones.filter((item) => item?.id && !DEFAULT_MILESTONES.some((seed) => seed.id === item.id)).map((item) => normalizeMilestone(item));
  return {
    schemaVersion: THICC_FITT_LLC_BUILD_SCHEMA_VERSION,
    companyName: 'THICC.FITT LLC',
    milestones: [...defaults, ...custom],
    workLog: (Array.isArray(incoming.workLog) ? incoming.workLog : []).map(normalizeWorkEntry),
    updatedAt: cleanText(incoming.updatedAt) || base.updatedAt,
  };
}

export function readThiccFittLlcBuildState() {
  if (typeof window === 'undefined' || !window.localStorage) return defaultState();
  try {
    return normalizeThiccFittLlcBuildState(JSON.parse(window.localStorage.getItem(THICC_FITT_LLC_BUILD_STORAGE_KEY) || 'null'));
  } catch {
    return defaultState();
  }
}

export function saveThiccFittLlcBuildState(value, detail = {}) {
  const state = normalizeThiccFittLlcBuildState({ ...value, updatedAt: new Date().toISOString() });
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(THICC_FITT_LLC_BUILD_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(THICC_FITT_LLC_BUILD_UPDATED_EVENT, { detail: { state, ...detail } }));
  }
  return state;
}

export function addThiccFittLlcWorkEntry(entry) {
  const state = readThiccFittLlcBuildState();
  state.workLog = [...state.workLog, normalizeWorkEntry(entry)];
  return saveThiccFittLlcBuildState(state, { reason: 'work-entry' });
}

export function updateThiccFittLlcMilestone(id, updates = {}) {
  const state = readThiccFittLlcBuildState();
  state.milestones = state.milestones.map((item) => item.id === id ? normalizeMilestone({ ...item, ...updates }, item) : item);
  return saveThiccFittLlcBuildState(state, { reason: 'milestone', milestoneId: id });
}

function sameDay(value, sourceDate) {
  return cleanText(value).slice(0, 10) === sourceDate;
}

function schoolSignal() {
  const state = normalizeSchoolState(readStorageJson('thicc_school_state_v1', null));
  const summary = summarizeSchoolState(state);
  const courses = Object.values(state.courses || {}).filter((course) => course.verifiedMaterial).map((course) => {
    const sections = Object.values(course.sections || {});
    return {
      id: course.id,
      title: course.title,
      deadline: course.deadline,
      completeSections: sections.filter((item) => item.status === 'complete').length,
      totalSections: sections.length,
      bestScore: sections.reduce((best, item) => Math.max(best, Number(item.practiceBestScore || 0)), 0),
    };
  });
  return { ...summary, courses };
}

function operationsSignal(sourceDate) {
  const clients = readStorageJson('thicc_clients', []);
  const forms = readStorageJson('thicc_client_forms', []);
  const assignments = readStorageJson('thicc_client_form_assignments', []);
  const logs = readStorageJson('thicc_client_logs', []);
  return {
    totalClients: Array.isArray(clients) ? clients.length : 0,
    activeClients: Array.isArray(clients) ? clients.filter((client) => client?.active !== false).length : 0,
    readyForms: Array.isArray(forms) ? forms.filter((form) => form?.active !== false).length : 0,
    assignedForms: Array.isArray(assignments) ? assignments.length : 0,
    activityCount: Array.isArray(logs) ? logs.filter((entry) => sameDay(entry?.ts, sourceDate)).length : 0,
  };
}

export function buildThiccFittLlcBuildSignal(date = new Date()) {
  const sourceDate = todayKey(date);
  const state = readThiccFittLlcBuildState();
  const dailyWork = state.workLog.filter((entry) => entry.date === sourceDate);
  const incomplete = state.milestones.filter((item) => item.status !== 'complete');
  const overdue = incomplete.filter((item) => item.targetDate && item.targetDate < sourceDate);
  const blocked = incomplete.filter((item) => item.status === 'blocked' || item.blockedBy);
  const prioritized = [...overdue, ...incomplete]
    .filter((item, index, rows) => rows.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((left, right) => (left.targetDate || '9999-12-31').localeCompare(right.targetDate || '9999-12-31'));
  const nextMilestone = prioritized[0] || null;
  return {
    schemaVersion: THICC_FITT_LLC_BUILD_SCHEMA_VERSION,
    source: 'THICC.FITT LLC BUILD',
    sourceDate,
    companyName: state.companyName,
    dailyWork,
    workMinutes: dailyWork.reduce((sum, entry) => sum + entry.minutes, 0),
    completedWork: dailyWork.filter((entry) => entry.status === 'complete').length,
    milestones: state.milestones,
    completedMilestones: state.milestones.filter((item) => item.status === 'complete').length,
    totalMilestones: state.milestones.length,
    overdueMilestones: overdue.map((item) => ({ id: item.id, title: item.title, targetDate: item.targetDate })),
    blockingItems: blocked.map((item) => ({ id: item.id, title: item.title, blockedBy: item.blockedBy })),
    nextRequiredAction: nextMilestone?.nextAction || nextMilestone?.title || '',
    nextMilestone: nextMilestone ? { id: nextMilestone.id, title: nextMilestone.title, targetDate: nextMilestone.targetDate, status: nextMilestone.status } : null,
    school: schoolSignal(),
    operations: operationsSignal(sourceDate),
    capturedAt: new Date().toISOString(),
  };
}
