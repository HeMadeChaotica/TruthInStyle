const DAY_CAPSULE_RENDER_RECORD_KEY = 'the_summation_day_capsule_render_record_v1';

export const DAY_CAPSULE_RENDER_STATUSES = Object.freeze({
  IDLE: 'idle',
  READY_TO_RENDER: 'ready_to_render',
  RENDERER_NOT_CONNECTED: 'renderer_not_connected',
  QUEUED: 'queued',
  RENDERING: 'rendering',
  RENDERED: 'rendered',
  REVISION_REQUESTED: 'revision_requested',
  REVISED: 'revised',
  FAILED: 'failed',
});

const SUPPORTED_RENDER_STATUSES = new Set(Object.values(DAY_CAPSULE_RENDER_STATUSES));

function hasStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readStorageObject(key, fallback = null) {
  if (!hasStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorageObject(key, value) {
  if (!hasStorage()) return value;
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function cleanText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item !== null && item !== undefined && String(item).trim().length > 0);
}

function makeRenderId(payloadId = '', sourceDate = '') {
  const base = cleanText(payloadId) || `day-capsule-${cleanText(sourceDate) || 'unsourced'}`;
  return `${base}-render`;
}

function normalizeStatus(status, fallback = DAY_CAPSULE_RENDER_STATUSES.IDLE) {
  return SUPPORTED_RENDER_STATUSES.has(status) ? status : fallback;
}

function normalizeRenderArtifact(artifact) {
  if (!artifact || typeof artifact !== 'object') return null;
  return {
    type: cleanText(artifact.type),
    url: cleanText(artifact.url),
    data: artifact.data || null,
    markup: cleanText(artifact.markup),
    metadata: artifact.metadata || {},
  };
}

export function buildDayCapsuleRenderRequest(dayCapsulePayload) {
  const now = new Date().toISOString();
  const dayIdentity = dayCapsulePayload?.dayIdentity || {};
  const payloadId = cleanText(dayCapsulePayload?.payloadId) || `day-capsule-${cleanText(dayIdentity.sourceDate) || 'unsourced'}`;

  return {
    renderId: makeRenderId(payloadId, dayIdentity.sourceDate),
    payloadId,
    dayIdentity: {
      titleOfDay: cleanText(dayIdentity.titleOfDay),
      displayDate: cleanText(dayIdentity.displayDate),
      dayOfWeek: cleanText(dayIdentity.dayOfWeek),
      chaoticaDayNumber: dayIdentity.chaoticaDayNumber ?? null,
      sourceDate: cleanText(dayIdentity.sourceDate),
    },
    assuredThoughts: {
      diaryEntry: cleanText(dayCapsulePayload?.assuredThoughts?.diaryEntry),
      pennyQuestions: normalizeList(dayCapsulePayload?.assuredThoughts?.pennyQuestions).slice(0, 2).map((entry, index) => ({
        id: cleanText(entry?.id) || `penny-${index + 1}`,
        question: cleanText(entry?.question),
        answer: cleanText(entry?.answer),
      })),
    },
    sourceSnapshot: {
      mood: dayCapsulePayload?.sourceSnapshot?.mood ?? null,
      wordOfDay: dayCapsulePayload?.sourceSnapshot?.wordOfDay ?? null,
      headHummer: dayCapsulePayload?.sourceSnapshot?.headHummer ?? null,
      era: dayCapsulePayload?.sourceSnapshot?.era ?? null,
      singlenessLevel: dayCapsulePayload?.sourceSnapshot?.singlenessLevel ?? null,
      moments: dayCapsulePayload?.sourceSnapshot?.moments || [],
      thiccTimeSignals: dayCapsulePayload?.sourceSnapshot?.thiccTimeSignals ?? null,
      rememberMeMoments: dayCapsulePayload?.sourceSnapshot?.rememberMeMoments || [],
      thiccFittSignals: dayCapsulePayload?.sourceSnapshot?.thiccFittSignals || [],
      daEaterSignals: dayCapsulePayload?.sourceSnapshot?.daEaterSignals || {},
      otherSignals: dayCapsulePayload?.sourceSnapshot?.otherSignals || {},
    },
    renderInstructions: {
      output: 'full-page Day Capsule',
      style: 'structured editorial document style',
      artAccents: 'base visual accents on actual day content only',
      identityClump: 'identity clump must be app-rendered or preserved deterministically',
      textAccuracy: 'do not rely only on image model spelling for date/title',
      providerBoundary: 'route external image providers through a backend/server/API boundary; do not expose private API keys in frontend code',
    },
    revision: {
      revisionNumber: dayCapsulePayload?.revision?.revisionNumber || 0,
      revisionComment: cleanText(dayCapsulePayload?.revision?.revisionComment),
    },
    createdAt: dayCapsulePayload?.createdAt || now,
    updatedAt: now,
  };
}

export function normalizeDayCapsuleRenderResult(result) {
  const now = new Date().toISOString();
  const renderRequest = result?.renderRequest || result?.request || null;
  const renderId = cleanText(result?.renderId) || cleanText(renderRequest?.renderId) || makeRenderId(renderRequest?.payloadId, renderRequest?.dayIdentity?.sourceDate);
  const status = normalizeStatus(result?.status, renderRequest ? DAY_CAPSULE_RENDER_STATUSES.READY_TO_RENDER : DAY_CAPSULE_RENDER_STATUSES.IDLE);

  return {
    renderId,
    status,
    renderRequest,
    renderArtifact: normalizeRenderArtifact(result?.renderArtifact || result?.artifact),
    error: result?.error || null,
    message: cleanText(result?.message),
    createdAt: result?.createdAt || renderRequest?.createdAt || now,
    updatedAt: result?.updatedAt || now,
  };
}

export function persistDayCapsuleRender(result) {
  const normalized = normalizeDayCapsuleRenderResult(result);
  return writeStorageObject(DAY_CAPSULE_RENDER_RECORD_KEY, normalized);
}

export function readPersistedDayCapsuleRender() {
  return normalizeDayCapsuleRenderResult(readStorageObject(DAY_CAPSULE_RENDER_RECORD_KEY, { status: DAY_CAPSULE_RENDER_STATUSES.IDLE }));
}

export function requestDayCapsuleRender(renderRequest) {
  const now = new Date().toISOString();
  return persistDayCapsuleRender({
    renderId: renderRequest?.renderId,
    status: DAY_CAPSULE_RENDER_STATUSES.RENDERER_NOT_CONNECTED,
    renderRequest,
    renderArtifact: null,
    message: 'Renderer not connected yet. Day Capsule payload is ready.',
    createdAt: renderRequest?.createdAt || now,
    updatedAt: now,
  });
}

export function getDayCapsuleRenderStatus(renderId) {
  const stored = readPersistedDayCapsuleRender();
  if (renderId && stored.renderId !== renderId) {
    return normalizeDayCapsuleRenderResult({ renderId, status: DAY_CAPSULE_RENDER_STATUSES.IDLE });
  }
  return stored;
}
