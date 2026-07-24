export const DAY_CAPSULE_RENDER_RECORD_KEY = 'the_summation_day_capsule_render_record_v1';


export const DAY_CAPSULE_VISUAL_STYLE_MODES = Object.freeze({
  JOURNAL_SPREAD: 'JOURNAL_SPREAD',
  SKETCHNOTE_MAP: 'SKETCHNOTE_MAP',
  STICKY_MEMORY_BOARD: 'STICKY_MEMORY_BOARD',
  EDITORIAL_CAPSULE: 'EDITORIAL_CAPSULE',
  OBJECT_LED_MEMORY_MAP: 'OBJECT_LED_MEMORY_MAP',
});

const STOP_WORDS = new Set('about above after again against all also and any are because been before being between both but can did does doing down each few for from further had has have her here hers him his how into its just more most not now off once only our ours out over own same she should some such than that the their them then there these they this those through too under until very was were what when where which while who why with you your'.split(' '));
const OBJECT_WORDS = ['coffee', 'tea', 'sandwich', 'salad', 'pizza', 'breakfast', 'lunch', 'dinner', 'snack', 'meal', 'market', 'grocery', 'groceries', 'gym', 'dumbbell', 'barbell', 'shoes', 'outfit', 'flower', 'flowers', 'room', 'desk', 'bed', 'car', 'train', 'book', 'phone', 'song', 'walk', 'workout', 'cardio', 'protein', 'water', 'weather', 'rain', 'sun', 'moon'];
const PLACE_WORDS = ['home', 'office', 'market', 'store', 'gym', 'park', 'room', 'kitchen', 'street', 'cafe', 'restaurant', 'studio', 'work', 'school'];
const REFLECTION_WORDS = ['feel', 'felt', 'feeling', 'think', 'thought', 'truth', 'release', 'survive', 'survived', 'choose', 'chose', 'pattern', 'problem', 'solve', 'solved', 'want', 'wanted', 'need', 'needed', 'body', 'mood', 'attention', 'remember'];
const FRAGMENT_WORDS = ['errand', 'reminder', 'note', 'scrap', 'todo', 'call', 'text', 'appointment', 'buy', 'pick', 'drop', 'clean'];
const METADATA_ONLY_KEYS = new Set([
  'sourceAvailability',
  'availableSourceSignals',
  'availability',
  'available',
  'enabled',
  'disabled',
  'configured',
  'config',
  'diagnostics',
  'diagnostic',
  'debug',
  'flags',
  'metadata',
  'sourceMetadata',
]);

function isBooleanMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([, entryValue]) => typeof entryValue === 'boolean');
}

function flattenText(value, options = {}) {
  if (value === null || value === undefined) return [];
  if (typeof value === 'boolean') return [];
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  if (Array.isArray(value)) return value.flatMap((entry) => flattenText(entry, options));
  if (typeof value === 'object') {
    if (isBooleanMap(value)) return [];
    return Object.entries(value).flatMap(([key, entryValue]) => {
      if (options.skipMetadata && METADATA_ONLY_KEYS.has(key)) return [];
      if (typeof entryValue === 'boolean' || isBooleanMap(entryValue)) return [];
      return flattenText(entryValue, options);
    });
  }
  return [];
}

function tokenizeVisualText(lines = []) {
  return lines
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/^['-]+|['-]+$/g, ''))
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function uniqueLimited(values = [], limit = 10) {
  const seen = new Set();
  return values
    .map(cleanText)
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function valuesFromObjects(items = [], keys = []) {
  return (Array.isArray(items) ? items : [])
    .flatMap((item) => keys.map((key) => item?.[key]))
    .map(cleanText)
    .filter(Boolean);
}

function stableContentSignature(value = {}) {
  if (!value || typeof value !== 'object') return String(cleanText(value) || '').toLowerCase();
  const id = cleanText(value.id || value.momentId || value.eventId || value.cardId);
  if (id) return `id:${id.toLowerCase()}`;
  return [
    value.date,
    value.dateKey,
    value.time,
    value.timestamp,
    value.title,
    value.description,
    value.text,
    value.detail,
    value.type,
    value.location,
    value.place,
  ]
    .map((entry) => cleanText(entry) || '')
    .join('|')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupeMoments(...momentFeeds) {
  const seen = new Set();
  return momentFeeds
    .flatMap((feed) => (Array.isArray(feed) ? feed : []))
    .filter((moment) => {
      const signature = stableContentSignature(moment);
      if (!signature || seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
}

function populatedPennyQuestions(pennyQuestions = []) {
  return (Array.isArray(pennyQuestions) ? pennyQuestions : []).filter((entry) => (
    cleanText(entry?.question)
      || cleanText(entry?.questionText)
      || cleanText(entry?.answer)
  ));
}

function pennyReflectionScore(pennyQuestions = []) {
  return populatedPennyQuestions(pennyQuestions).reduce((score, entry) => {
    if (cleanText(entry?.answer)) return score + 2;
    return score + 1;
  }, 0);
}

function extractRepeatedWords(tokens = []) {
  const counts = tokens.reduce((map, token) => map.set(token, (map.get(token) || 0) + 1), new Map());
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 8);
}

export function analyzeDayCapsuleVisualContent(dayCapsulePayload = {}) {
  const snapshot = dayCapsulePayload.sourceSnapshot || {};
  const assured = dayCapsulePayload.assuredThoughts || {};
  const pennyQuestions = Array.isArray(assured.pennyQuestions) ? assured.pennyQuestions : [];
  const moments = Array.isArray(snapshot.moments) ? snapshot.moments : [];
  const rememberMeMoments = Array.isArray(snapshot.rememberMeMoments) ? snapshot.rememberMeMoments : [];
  const dedupedMoments = dedupeMoments(moments, rememberMeMoments);
  const mealHighlights = Array.isArray(snapshot.daEaterSignals?.mealHighlights) ? snapshot.daEaterSignals.mealHighlights : [];
  const thiccFittSignals = Array.isArray(snapshot.thiccFittSignals) ? snapshot.thiccFittSignals : [];
  const thiccTimeText = flattenText(snapshot.thiccTimeSignals);
  const otherSignalText = flattenText(snapshot.otherSignals, { skipMetadata: true });
  const explicitLines = [
    assured.diaryEntry,
    ...pennyQuestions.flatMap((entry) => [entry?.question, entry?.answer]),
    snapshot.mood,
    snapshot.wordOfDay?.word,
    snapshot.wordOfDay?.definition,
    snapshot.headHummer,
    snapshot.era,
    ...valuesFromObjects(dedupedMoments, ['type', 'text', 'description', 'detail', 'time', 'place', 'location']),
    ...thiccFittSignals,
    ...valuesFromObjects(mealHighlights, ['time', 'label', 'macroText', 'status', 'name', 'type']),
    ...thiccTimeText,
    ...otherSignalText,
  ].map(cleanText).filter(Boolean);
  const tokens = tokenizeVisualText(explicitLines);
  const tokenSet = new Set(tokens);
  const objectHints = uniqueLimited([
    ...valuesFromObjects(mealHighlights, ['label', 'name', 'type']),
    ...thiccFittSignals.filter((line) => {
      const lineTokens = new Set(tokenizeVisualText([line]));
      return OBJECT_WORDS.some((word) => lineTokens.has(word));
    }),
    ...OBJECT_WORDS.filter((word) => tokenSet.has(word)),
  ], 12);
  const places = uniqueLimited([
    ...valuesFromObjects(rememberMeMoments, ['place', 'location']),
    ...PLACE_WORDS.filter((word) => tokenSet.has(word)),
  ], 8);
  const motifHints = uniqueLimited([
    snapshot.mood && `mood: ${snapshot.mood}`,
    snapshot.wordOfDay?.word && `word: ${snapshot.wordOfDay.word}`,
    snapshot.headHummer && `song/head hummer: ${snapshot.headHummer}`,
    snapshot.era && `era: ${snapshot.era}`,
    ...places.map((place) => `place: ${place}`),
    ...extractRepeatedWords(tokens).map((word) => `repeated word: ${word}`),
  ], 14);
  return {
    eventCount: dedupedMoments.length,
    pennyCount: pennyQuestions.filter((entry) => cleanText(entry?.answer)).length,
    mealCount: mealHighlights.length,
    objectHints,
    motifHints,
    places,
    repeatedWords: extractRepeatedWords(tokens),
    reflectionScore: tokens.filter((token) => REFLECTION_WORDS.includes(token)).length + pennyReflectionScore(pennyQuestions),
    fragmentScore: tokens.filter((token) => FRAGMENT_WORDS.includes(token)).length + Math.max(0, explicitLines.length - 8),
    hasStrongNarrative: Boolean(cleanText(assured.diaryEntry) || pennyQuestions.some((entry) => cleanText(entry?.answer)?.length > 80)),
  };
}

export function selectDayCapsuleVisualStyleMode(dayCapsulePayload = {}) {
  const analysis = analyzeDayCapsuleVisualContent(dayCapsulePayload);
  if (analysis.objectHints.length >= 3 || analysis.mealCount >= 2) return DAY_CAPSULE_VISUAL_STYLE_MODES.OBJECT_LED_MEMORY_MAP;
  if (analysis.eventCount >= 4 && (analysis.places.length || analysis.objectHints.length)) return DAY_CAPSULE_VISUAL_STYLE_MODES.JOURNAL_SPREAD;
  if (analysis.reflectionScore >= 5) return DAY_CAPSULE_VISUAL_STYLE_MODES.SKETCHNOTE_MAP;
  if (analysis.fragmentScore >= 6 && analysis.eventCount < 4) return DAY_CAPSULE_VISUAL_STYLE_MODES.STICKY_MEMORY_BOARD;
  if (analysis.eventCount >= 3 && (analysis.places.length || analysis.objectHints.length)) return DAY_CAPSULE_VISUAL_STYLE_MODES.JOURNAL_SPREAD;
  return DAY_CAPSULE_VISUAL_STYLE_MODES.EDITORIAL_CAPSULE;
}

export function buildDayCapsuleVisualInstructions(dayCapsulePayload = {}) {
  const analysis = analyzeDayCapsuleVisualContent(dayCapsulePayload);
  const styleMode = selectDayCapsuleVisualStyleMode(dayCapsulePayload);
  const styleLooks = {
    JOURNAL_SPREAD: 'illustrated notebook spread with hand-drawn objects, short labels, and scattered but readable story fragments',
    SKETCHNOTE_MAP: 'sketchnote narrative board with keyword clusters, arrows/pathways, callouts, and symbolic doodles',
    STICKY_MEMORY_BOARD: 'overlapping sticky-note memory board with pinned fragments, varied mini-panels, and playful blocks',
    EDITORIAL_CAPSULE: 'polished editorial daily capsule page with clean hierarchy, structured title area, art accents, and readable blocks',
    OBJECT_LED_MEMORY_MAP: 'object-led memory map with illustrated items and labels arranged around the day identity',
  };
  return {
    styleMode,
    compositionGoal: `Create one full-page illustrated Day Capsule as a single personal memory page: ${styleLooks[styleMode]}.`,
    visualTone: 'premium but personal; hand-drawn/designed page energy; visual journal, sketchnote, and editorial memory-page sensibility',
    layoutRules: [
      'One cohesive full-page illustrated day page, not a dashboard and not a version editor.',
      'Use readable hierarchy, object-led day storytelling, short callouts, and grouped story fragments.',
      styleMode === DAY_CAPSULE_VISUAL_STYLE_MODES.EDITORIAL_CAPSULE ? 'Editorial polish is allowed, but keep it personal and non-corporate.' : 'Avoid corporate infographic styling.',
    ],
    motifHints: analysis.motifHints,
    objectHints: analysis.objectHints,
    textRules: [
      'Use short readable labels and tiny callouts only; do not render giant paragraphs or raw source dumps.',
      'Decorative text fragments may be approximate, but must be content-led and must not invent events.',
      'Do not rely on generated image text for the identity clump. The app will overlay/preserve it.',
    ],
    identityClumpRule: 'The app deterministically preserves titleOfDay, displayDate in MM/DD/YYYY, fully spelled dayOfWeek, and chaoticaDayNumber; image generation must leave room and must not be trusted for these values.',
    colorDirection: 'Derive palette from the real mood/era/day content when present; otherwise use warm paper, ink, accent-marker, and collage tones.',
    forbiddenBehaviors: [
      'Do not generate fake day data, fake people, fake places, fake meals, fake workouts, or major events not present in the payload.',
      'Do not create a generic dashboard, source analysis panel, raw JSON page, API-key exposure, or user-facing motif/theme controls.',
      'Do not make identity text illegible; do not move sacred glyphs or alter the app frame.',
    ],
  };
}

export const DAY_CAPSULE_RENDER_STATUSES = Object.freeze({
  IDLE: 'idle',
  READY_TO_RENDER: 'ready_to_render',
  LOCAL_PROOF_RENDERED: 'local_proof_rendered',
  EXTERNAL_RENDERER_NOT_CONFIGURED: 'external_renderer_not_configured',
  EXTERNAL_RENDERER_READY: 'external_renderer_ready',
  EXTERNAL_RENDERING: 'external_rendering',
  EXTERNAL_RENDERED: 'external_rendered',
  EXTERNAL_RENDER_FAILED: 'external_render_failed',
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
  const hasArtifactReference = Boolean(
    cleanText(artifact.artifactUrl || artifact.url || artifact.artifactPath || artifact.previewPath || artifact.markup)
      || artifact.artifactBlob
      || artifact.blob
  );
  if (!hasArtifactReference) return null;
  return {
    artifactType: cleanText(artifact.artifactType || artifact.type),
    type: cleanText(artifact.type || artifact.artifactType),
    artifactUrl: cleanText(artifact.artifactUrl || artifact.url),
    url: cleanText(artifact.url || artifact.artifactUrl || artifact.artifactPath || artifact.previewPath),
    artifactPath: cleanText(artifact.artifactPath),
    artifactBlob: artifact.artifactBlob || artifact.blob || null,
    thumbnailUrl: cleanText(artifact.thumbnailUrl),
    previewPath: cleanText(artifact.previewPath),
    data: artifact.data || null,
    markup: cleanText(artifact.markup),
    providerMetadata: artifact.providerMetadata || artifact.metadata || {},
    metadata: artifact.metadata || artifact.providerMetadata || {},
  };
}

export function buildExternalDayCapsuleRenderRequest(dayCapsulePayload) {
  const now = new Date().toISOString();
  const rawDayIdentity = dayCapsulePayload?.dayIdentity || {};
  const sourceDate = cleanText(rawDayIdentity.sourceDate || dayCapsulePayload?.sourceDate);
  const dayIdentity = {
    ...rawDayIdentity,
    titleOfDay: cleanText(rawDayIdentity.titleOfDay || dayCapsulePayload?.titleOfDay || dayCapsulePayload?.title),
    displayDate: cleanText(rawDayIdentity.displayDate || dayCapsulePayload?.displayDate),
    dayOfWeek: cleanText(rawDayIdentity.dayOfWeek || dayCapsulePayload?.dayOfWeek),
    sourceDate,
    chaoticaDayNumber: rawDayIdentity.chaoticaDayNumber ?? dayCapsulePayload?.chaoticaDayNumber ?? null,
  };
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
    visualInstructions: buildDayCapsuleVisualInstructions(dayCapsulePayload),
    renderIntent: {
      output: 'create one full-page illustrated Day Capsule',
      contentRule: 'use real day content only',
      composition: 'visual-journal/sketchnote/editorial memory-page composition',
      artAccents: 'use object-led day storytelling with content-led art accents from visualInstructions.objectHints and visualInstructions.motifHints',
      textAccuracy: 'Do not rely on generated image text for the identity clump. The app will overlay/preserve it.',
      hierarchy: 'short labels, readable callouts, premium but personal composition, no raw source dump',
      eventRule: 'do not invent major day events, people, places, foods, workouts, or reminders',
      dashboardRule: 'no generic dashboard and no corporate infographic unless visualInstructions.styleMode is EDITORIAL_CAPSULE',
      identityClump: 'preserve identity clump deterministically at app layer',
      providerBoundary: 'external image providers must run only through a backend/server/API boundary',
    },
    revision: {
      revisionNumber: dayCapsulePayload?.revision?.revisionNumber || 0,
      revisionComment: cleanText(dayCapsulePayload?.revision?.revisionComment),
    },
    createdAt: dayCapsulePayload?.createdAt || now,
    updatedAt: now,
  };
}

export function normalizeExternalDayCapsuleRenderResult(result) {
  const now = new Date().toISOString();
  const renderRequest = result?.renderRequest || result?.request || null;
  const renderId = cleanText(result?.renderId) || cleanText(renderRequest?.renderId) || makeRenderId(renderRequest?.payloadId, renderRequest?.dayIdentity?.sourceDate);
  const status = normalizeStatus(result?.status, renderRequest ? DAY_CAPSULE_RENDER_STATUSES.READY_TO_RENDER : DAY_CAPSULE_RENDER_STATUSES.IDLE);

  return {
    renderId,
    status,
    renderRequest,
    payloadId: cleanText(result?.payloadId) || cleanText(renderRequest?.payloadId),
    artifactType: cleanText(result?.artifactType || result?.renderArtifact?.artifactType || result?.artifact?.artifactType),
    artifactUrl: cleanText(result?.artifactUrl || result?.renderArtifact?.artifactUrl || result?.artifact?.artifactUrl || result?.renderArtifact?.url || result?.artifact?.url),
    artifactPath: cleanText(result?.artifactPath || result?.renderArtifact?.artifactPath || result?.artifact?.artifactPath),
    artifactBlob: result?.artifactBlob || result?.renderArtifact?.artifactBlob || result?.artifact?.artifactBlob || null,
    thumbnailUrl: cleanText(result?.thumbnailUrl || result?.renderArtifact?.thumbnailUrl || result?.artifact?.thumbnailUrl),
    previewPath: cleanText(result?.previewPath || result?.renderArtifact?.previewPath || result?.artifact?.previewPath),
    providerMetadata: result?.providerMetadata || result?.renderArtifact?.providerMetadata || result?.artifact?.providerMetadata || {},
    providerPrompt: cleanText(result?.providerPrompt),
    providerReason: cleanText(result?.providerReason || result?.reason || result?.details?.reason),
    providerStatus: result?.providerStatus ?? result?.statusCode ?? null,
    providerCode: cleanText(result?.providerCode || result?.code),
    providerType: cleanText(result?.providerType || result?.type),
    configured: typeof result?.configured === 'boolean' ? result.configured : result?.configDiagnostic?.configured,
    missingConfig: normalizeList(result?.missingConfig || result?.missingEnv || result?.configDiagnostic?.missingEnv),
    configDiagnostic: result?.configDiagnostic || null,
    retryable: typeof result?.retryable === 'boolean' ? result.retryable : null,
    renderArtifact: normalizeRenderArtifact(result?.renderArtifact || result?.artifact || (result?.artifactUrl || result?.artifactPath || result?.artifactBlob || result?.previewPath ? result : null)),
    error: result?.error || null,
    message: cleanText(result?.message),
    createdAt: result?.createdAt || renderRequest?.createdAt || now,
    updatedAt: result?.updatedAt || now,
  };
}

export function persistExternalDayCapsuleRender(result) {
  const normalized = normalizeExternalDayCapsuleRenderResult(result);
  return writeStorageObject(DAY_CAPSULE_RENDER_RECORD_KEY, normalized);
}

export function readPersistedDayCapsuleRender() {
  return normalizeExternalDayCapsuleRenderResult(readStorageObject(DAY_CAPSULE_RENDER_RECORD_KEY, { status: DAY_CAPSULE_RENDER_STATUSES.IDLE }));
}

export function requestLocalProofDayCapsuleRender(renderRequest) {
  const now = new Date().toISOString();
  const localProofArtifact = buildLocalProofArtifact(renderRequest);
  if (localProofArtifact) {
    return persistExternalDayCapsuleRender({
      renderId: renderRequest?.renderId,
      status: DAY_CAPSULE_RENDER_STATUSES.LOCAL_PROOF_RENDERED,
      renderRequest,
      renderArtifact: localProofArtifact,
      message: 'Local proof render created from the real Day Capsule payload. External renderer is not configured; this is preview-only, not a final Day Capsule.',
      createdAt: renderRequest?.createdAt || now,
      updatedAt: now,
    });
  }
  return persistExternalDayCapsuleRender({
    renderId: renderRequest?.renderId,
    status: DAY_CAPSULE_RENDER_STATUSES.EXTERNAL_RENDERER_NOT_CONFIGURED,
    renderRequest,
    renderArtifact: null,
    message: 'External renderer is not configured yet.',
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


export const buildDayCapsuleRenderRequest = buildExternalDayCapsuleRenderRequest;
export const normalizeDayCapsuleRenderResult = normalizeExternalDayCapsuleRenderResult;
export const persistDayCapsuleRender = persistExternalDayCapsuleRender;

export async function requestExternalDayCapsuleRender(renderRequest) {
  const now = new Date().toISOString();
  const renderingRecord = persistExternalDayCapsuleRender({
    renderId: renderRequest?.renderId,
    payloadId: renderRequest?.payloadId,
    status: DAY_CAPSULE_RENDER_STATUSES.EXTERNAL_RENDERING,
    renderRequest,
    renderArtifact: null,
    message: 'Rendering Day Capsule…',
    createdAt: renderRequest?.createdAt || now,
    updatedAt: now,
  });
  try {
    const response = await fetch('/api/day-capsule-render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ renderRequest }),
    });
    const result = await response.json().catch(() => ({}));
    return persistExternalDayCapsuleRender({ ...result, renderRequest: result?.renderRequest || renderRequest });
  } catch (error) {
    return persistExternalDayCapsuleRender({
      ...renderingRecord,
      status: DAY_CAPSULE_RENDER_STATUSES.EXTERNAL_RENDER_FAILED,
      renderArtifact: null,
      artifactUrl: null,
      message: 'External Day Capsule render failed.',
      error: error?.message || 'External Day Capsule render failed.',
      updatedAt: new Date().toISOString(),
    });
  }
}

export function requestDayCapsuleRender(renderRequest, { mode = 'external' } = {}) {
  if (mode === 'local_proof') return requestLocalProofDayCapsuleRender(renderRequest);
  return requestExternalDayCapsuleRender(renderRequest);
}

export async function uploadManualDayCapsuleArtifact(image, renderRequest) {
  const formData = new FormData();
  formData.set('image', image);
  formData.set('renderRequest', JSON.stringify(renderRequest));
  const response = await fetch('/api/day-capsule-render/manual', {
    method: 'POST',
    body: formData,
  });
  const result = await response.json().catch(() => ({
    status: DAY_CAPSULE_RENDER_STATUSES.EXTERNAL_RENDER_FAILED,
    message: 'The visualization upload returned an unreadable response.',
  }));
  return persistExternalDayCapsuleRender({
    ...result,
    renderRequest: result?.renderRequest || renderRequest,
  });
}

export const getExternalDayCapsuleRenderStatus = getDayCapsuleRenderStatus;
