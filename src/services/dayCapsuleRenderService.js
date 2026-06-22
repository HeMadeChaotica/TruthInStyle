export const DAY_CAPSULE_RENDER_RECORD_KEY = 'the_summation_day_capsule_render_record_v1';

export const DAY_CAPSULE_RENDER_STATUSES = Object.freeze({
  IDLE: 'idle',
  READY_TO_RENDER: 'ready_to_render',
  RENDERER_NOT_CONNECTED: 'renderer_not_connected',
  LOCAL_PROOF_RENDERED: 'local_proof_rendered',
  EXTERNAL_RENDERER_READY: 'external_renderer_ready',
  EXTERNAL_RENDERING: 'external_rendering',
  EXTERNAL_RENDERED: 'external_rendered',
  EXTERNAL_RENDERER_NOT_CONFIGURED: 'external_renderer_not_configured',
  EXTERNAL_RENDER_FAILED: 'external_render_failed',
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

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function svgDataUrl(markup) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`;
}

function textHash(value) {
  return String(value ?? '').split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function collectContentLines(renderRequest = {}) {
  const snapshot = renderRequest.sourceSnapshot || {};
  const penny = renderRequest.assuredThoughts?.pennyQuestions || [];
  return [
    renderRequest.assuredThoughts?.diaryEntry,
    snapshot.mood && `Mood: ${snapshot.mood}`,
    snapshot.wordOfDay?.word && `Word: ${snapshot.wordOfDay.word}`,
    snapshot.headHummer && `Head hummer: ${snapshot.headHummer}`,
    snapshot.era && `Era: ${snapshot.era}`,
    ...(Array.isArray(snapshot.moments) ? snapshot.moments.map((item) => item?.text || item?.type || item) : []),
    ...(Array.isArray(snapshot.thiccFittSignals) ? snapshot.thiccFittSignals : []),
    ...(Array.isArray(snapshot.daEaterSignals?.mealHighlights) ? snapshot.daEaterSignals.mealHighlights.map((item) => item?.label || item?.macroText || item) : []),
    ...penny.map((entry) => entry?.answer || entry?.question),
  ].map(cleanText).filter(Boolean).slice(0, 8);
}

function proofPalette(renderRequest = {}) {
  const seed = Math.abs(textHash(JSON.stringify(renderRequest.sourceSnapshot || {}) + renderRequest.dayIdentity?.titleOfDay));
  const palettes = [
    ['#301221', '#ffbad0', '#ffd966', '#fff4f7'],
    ['#162133', '#9fd8ff', '#ff9f7a', '#f4fbff'],
    ['#241635', '#d5b3ff', '#77f2c4', '#fff8ef'],
    ['#2c1b12', '#ffc17a', '#f06f8f', '#fff4e6'],
  ];
  return palettes[seed % palettes.length];
}

// Level 2 requirement: local proof is only a payload/pipeline proof. Final production
// Day Capsules require an external illustrated renderer through a server/API boundary.
function buildLocalProofArtifact(renderRequest) {
  if (!renderRequest?.dayIdentity) return null;
  const [bg, accent, accentTwo, paper] = proofPalette(renderRequest);
  const identity = renderRequest.dayIdentity;
  const lines = collectContentLines(renderRequest);
  const seed = Math.abs(textHash(lines.join('|') || identity.titleOfDay || identity.sourceDate));
  const circles = Array.from({ length: 5 }, (_, index) => {
    const x = 120 + ((seed >> (index * 3)) % 620);
    const y = 180 + ((seed >> (index * 4)) % 720);
    const r = 24 + ((seed >> (index + 2)) % 54);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${index % 2 ? accent : accentTwo}" opacity="0.16" />`;
  }).join('');
  const lineMarkup = (lines.length ? lines : ['Real Day Capsule payload received. Renderer proof artifact created locally.'])
    .map((line, index) => `<text x="112" y="${480 + index * 46}" class="body">${escapeXml(line).slice(0, 108)}</text>`)
    .join('');
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" role="img" aria-label="Local proof Day Capsule render">
    <style>.k{font:700 20px Arial,sans-serif;letter-spacing:3px;text-transform:uppercase}.title{font:800 58px Georgia,serif}.meta{font:700 24px Arial,sans-serif}.body{font:500 24px Arial,sans-serif}.small{font:700 16px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase}</style>
    <rect width="900" height="1200" fill="${bg}"/>
    <rect x="54" y="54" width="792" height="1092" rx="34" fill="${paper}" opacity="0.94"/>
    ${circles}
    <path d="M92 374 C220 330 325 420 460 374 S700 316 808 378" fill="none" stroke="${accent}" stroke-width="10" opacity="0.65"/>
    <text x="92" y="130" class="k" fill="${bg}">LOCAL PROOF RENDER · DAY CAPSULE</text>
    <text x="92" y="224" class="title" fill="${bg}">${escapeXml(identity.titleOfDay || 'Untitled Day')}</text>
    <text x="92" y="286" class="meta" fill="${bg}">${escapeXml(identity.displayDate || '')} · ${escapeXml(identity.dayOfWeek || '')} · CHAOTICA DAY #${escapeXml(identity.chaoticaDayNumber ?? '')}</text>
    <text x="92" y="424" class="small" fill="${bg}">CONTENT-SPECIFIC PROOF NOTES</text>
    ${lineMarkup}
    <rect x="92" y="1036" width="716" height="2" fill="${accent}" opacity="0.8"/>
    <text x="92" y="1084" class="small" fill="${bg}">Identity clump is app-rendered from payload data; no fake AI image.</text>
  </svg>`;
  return { type: 'image/svg+xml', url: svgDataUrl(markup), markup, metadata: { mode: 'local_proof', generatedFromPayloadId: renderRequest.payloadId } };
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
      level2Requirement: 'Crystal Wand payload → render request → real renderer connection → illustrated Day Capsule artifact → preview in THE.SUMMATION → one revision later → final seal to Hopewood later',
      allowedArtDirection: 'sketchnote boards; illustrated journal spreads; object-led memory pages; sticky-note memory boards; editorial daily capsule layouts',
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
  const localProofArtifact = buildLocalProofArtifact(renderRequest);
  if (localProofArtifact) {
    return persistDayCapsuleRender({
      renderId: renderRequest?.renderId,
      status: DAY_CAPSULE_RENDER_STATUSES.LOCAL_PROOF_RENDERED,
      renderRequest,
      renderArtifact: localProofArtifact,
      message: 'Local proof render created from the real Day Capsule payload. External renderer is not configured; this is preview-only, not a final Day Capsule.',
      createdAt: renderRequest?.createdAt || now,
      updatedAt: now,
    });
  }
  return persistDayCapsuleRender({
    renderId: renderRequest?.renderId,
    status: DAY_CAPSULE_RENDER_STATUSES.EXTERNAL_RENDERER_NOT_CONFIGURED,
    renderRequest,
    renderArtifact: null,
    message: 'External renderer not configured. Day Capsule payload is ready, but Level 2 final render is blocked.',
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
