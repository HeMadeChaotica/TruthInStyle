import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import { buildDayCapsuleVisualInstructions } from '../services/dayCapsuleRenderService';
import {
  isSupabaseArtifactStorageConfigured,
  uploadDayCapsuleArtifactToSupabase,
} from './dayCapsuleSupabaseStorage';

const STATUS = Object.freeze({
  NOT_CONFIGURED: 'external_renderer_not_configured',
  RENDERED: 'external_rendered',
  FAILED: 'external_render_failed',
});

const DAY_CAPSULE_LANDSCAPE_SIZE = '1536x1024';
const RETRYABLE_PROVIDER_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function cleanText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function getProviderName() {
  return cleanText(process.env.DAY_CAPSULE_RENDER_PROVIDER)?.toLowerCase() || null;
}

function getModel() {
  return cleanText(process.env.DAY_CAPSULE_RENDER_MODEL) || 'gpt-image-1';
}

function getStorageMode() {
  return cleanText(process.env.DAY_CAPSULE_RENDER_STORAGE_MODE)?.toLowerCase() || 'none';
}

function isLocalArtifactStorageConfigured() {
  const storageMode = getStorageMode();
  const storagePath = cleanText(process.env.DAY_CAPSULE_RENDER_STORAGE_PATH);
  return storageMode === 'local' && process.env.NODE_ENV !== 'production' && Boolean(storagePath);
}

function getProviderConfigDiagnostic() {
  const provider = getProviderName();
  const storageMode = getStorageMode();
  const hasApiKey = Boolean(cleanText(process.env.DAY_CAPSULE_RENDER_API_KEY));
  const hasStoragePath = Boolean(cleanText(process.env.DAY_CAPSULE_RENDER_STORAGE_PATH));
  const hasSupabaseBucket = Boolean(cleanText(process.env.DAY_CAPSULE_SUPABASE_BUCKET));
  const supabaseConfigured = isSupabaseArtifactStorageConfigured() && hasSupabaseBucket;
  const checks = {
    provider: provider === 'openai',
    apiKey: hasApiKey,
    storageMode: storageMode === 'supabase' || (storageMode === 'local' && process.env.NODE_ENV !== 'production'),
    supabaseStorage: storageMode === 'supabase' ? supabaseConfigured : null,
    localStorage: storageMode === 'local' ? isLocalArtifactStorageConfigured() : null,
  };
  const missingEnv = [];
  if (provider !== 'openai') missingEnv.push('DAY_CAPSULE_RENDER_PROVIDER');
  if (!hasApiKey) missingEnv.push('DAY_CAPSULE_RENDER_API_KEY');
  if (storageMode !== 'supabase' && storageMode !== 'local') missingEnv.push('DAY_CAPSULE_RENDER_STORAGE_MODE');
  if (storageMode === 'supabase' && !cleanText(process.env.NEXT_PUBLIC_SUPABASE_URL)) missingEnv.push('NEXT_PUBLIC_SUPABASE_URL');
  if (storageMode === 'supabase' && !cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY)) missingEnv.push('SUPABASE_SERVICE_ROLE_KEY');
  if (storageMode === 'supabase' && !cleanText(process.env.DAY_CAPSULE_SUPABASE_BUCKET)) missingEnv.push('DAY_CAPSULE_SUPABASE_BUCKET');
  if (storageMode === 'local' && process.env.NODE_ENV === 'production') missingEnv.push('DAY_CAPSULE_RENDER_STORAGE_MODE=supabase');
  if (storageMode === 'local' && process.env.NODE_ENV !== 'production' && !hasStoragePath) missingEnv.push('DAY_CAPSULE_RENDER_STORAGE_PATH');
  return { checks, missingEnv, configured: provider === 'openai' && hasApiKey && (storageMode === 'supabase' ? supabaseConfigured : isLocalArtifactStorageConfigured()) };
}

export function isDayCapsuleProviderConfigured() {
  return getProviderConfigDiagnostic().configured;
}

export function getDayCapsuleRenderConfigDiagnostic() {
  const providerDiagnostic = getProviderConfigDiagnostic();
  const endpointConfigured = Boolean(cleanText(process.env.DAY_CAPSULE_RENDER_ENDPOINT));
  return {
    checks: {
      ...providerDiagnostic.checks,
      externalEndpoint: endpointConfigured,
    },
    missingEnv: providerDiagnostic.configured || endpointConfigured ? [] : providerDiagnostic.missingEnv,
    requiredProductionEnv: [
      'DAY_CAPSULE_RENDER_PROVIDER',
      'DAY_CAPSULE_RENDER_API_KEY',
      'DAY_CAPSULE_RENDER_STORAGE_MODE',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DAY_CAPSULE_SUPABASE_BUCKET',
    ],
    configured: providerDiagnostic.configured || endpointConfigured,
  };
}

function safeJson(value) {
  return JSON.stringify(value ?? null, null, 2);
}

export function buildProviderPrompt(renderRequest) {
  const dayIdentity = renderRequest?.dayIdentity || {};
  const visualInstructions = renderRequest?.visualInstructions || buildDayCapsuleVisualInstructions({
    dayIdentity,
    assuredThoughts: renderRequest?.assuredThoughts || {},
    sourceSnapshot: renderRequest?.sourceSnapshot || {},
  });

  return [
    'Create one wide LANDSCAPE illustrated Day Capsule artifact from the supplied real Day Capsule payload only.',
    'MANDATORY CANVAS: 3:2 horizontal landscape orientation, 1536 pixels wide by 1024 pixels tall. Width must be greater than height.',
    'Compose the entire memory page from left to right across the wide canvas. Do not create a portrait page, vertical poster, tall scrapbook, phone layout, or rotate a portrait design into a landscape frame.',
    'Keep all important content inside landscape-safe margins so the finished artifact can fill THE.SUMMATION and HOPEWOOD landscape render panels without cropping.',
    'Style: visual journal / sketchnote / editorial memory-page. Use object-led accents only when they are supported by actual day content.',
    'Build a readable hierarchy with personal memory-page composition. Do not make a generic dashboard, raw metadata dump, API panel, or corporate report.',
    'Do not invent events, people, places, meals, workouts, reminders, emotions, or objects that are not present in the payload.',
    'MANDATORY TOP HEADER: reserve a clean, high-contrast header band across the top of the page.',
    `In that header, visibly attempt these exact values: "${dayIdentity.titleOfDay || 'UNTITLED DAY'}" · "${dayIdentity.displayDate || ''}" · "${dayIdentity.dayOfWeek || ''}" · "CHAOTICA DAY #${dayIdentity.chaoticaDayNumber ?? ''}".`,
    'Spell the title, date, weekday, and Chaotica Day number exactly as supplied. Do not replace them with blank boxes, symbols, a lone #, or invented wording.',
    'The app will also overlay this same identity header deterministically, so keep the top header band uncluttered and do not place illustrations behind it.',
    'POPULATED SECTION RULE: include every non-empty source section supplied below. Never omit a populated THICC.FITT, DA.EATER, REMEMBER.ME, THICC.TIME, ASSURER, Penny Answer, or day-moment section.',
    'Give populated workout details a clearly labeled THICC.FITT area; give populated meal or macro details a DA.EATER area; omit only sections whose supplied values are empty.',
    'Prefer concise faithful summaries when the page is crowded, but preserve the day-specific facts and never substitute generic filler.',
    '',
    'DAY IDENTITY CLUMP:',
    safeJson({
      titleOfDay: dayIdentity.titleOfDay || null,
      displayDate: dayIdentity.displayDate || null,
      dayOfWeek: dayIdentity.dayOfWeek || null,
      chaoticaDayNumber: dayIdentity.chaoticaDayNumber ?? null,
      sourceDate: dayIdentity.sourceDate || null,
    }),
    '',
    'VISUAL INSTRUCTIONS:',
    safeJson(visualInstructions),
    '',
    'ASSURED THOUGHTS:',
    safeJson(renderRequest?.assuredThoughts || {}),
    '',
    'PENNY ANSWERS:',
    safeJson(renderRequest?.assuredThoughts?.pennyQuestions || []),
    '',
    'SOURCE SNAPSHOT:',
    safeJson(renderRequest?.sourceSnapshot || {}),
  ].join('\n');
}

function contentTypeToExtension(contentType = '') {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  return 'png';
}

async function storeBase64Artifact(base64Data, renderRequest, contentType = 'image/png') {
  const storageMode = getStorageMode();
  if (storageMode === 'supabase') {
    try {
      return await uploadDayCapsuleArtifactToSupabase(base64Data, renderRequest, contentType);
    } catch (error) {
      return { error: error?.message || 'supabase_upload_failed' };
    }
  }

  if (storageMode !== 'local' || process.env.NODE_ENV === 'production') {
    return { error: 'missing_supabase_storage' };
  }

  const storagePath = cleanText(process.env.DAY_CAPSULE_RENDER_STORAGE_PATH);
  if (!storagePath) return { error: 'missing_storage_path' };

  const extension = contentTypeToExtension(contentType);
  const safeRenderId = cleanText(renderRequest?.renderId)?.replace(/[^a-z0-9._-]/gi, '-') || randomUUID();
  const absoluteDir = path.isAbsolute(storagePath) ? storagePath : path.join(process.cwd(), storagePath);
  await mkdir(absoluteDir, { recursive: true });
  const filename = `${safeRenderId}.${extension}`;
  const absolutePath = path.join(absoluteDir, filename);
  await writeFile(absolutePath, Buffer.from(base64Data, 'base64'));

  const publicDir = path.join(process.cwd(), 'public');
  const relativeToPublic = path.relative(publicDir, absolutePath);
  const artifactPath = !relativeToPublic.startsWith('..') && !path.isAbsolute(relativeToPublic)
    ? `/${relativeToPublic.split(path.sep).join('/')}`
    : absolutePath;

  return { artifactPath, artifactType: contentType };
}

export async function normalizeProviderArtifact(providerResponse, renderRequest) {
  const now = new Date().toISOString();
  const dataItem = Array.isArray(providerResponse?.data) ? providerResponse.data[0] : null;
  const artifactUrl = cleanText(providerResponse?.artifactUrl || providerResponse?.url || providerResponse?.imageUrl || dataItem?.url);
  const artifactPath = cleanText(providerResponse?.artifactPath || providerResponse?.path);
  const artifactBlob = providerResponse?.artifactBlob || providerResponse?.blob || null;
  const base64 = cleanText(providerResponse?.artifactBase64 || providerResponse?.b64_json || dataItem?.b64_json);
  const dayIdentity = renderRequest?.dayIdentity || null;
  let storedArtifact = {};

  if (base64 && !artifactUrl && !artifactPath && !artifactBlob) {
    storedArtifact = await storeBase64Artifact(base64, renderRequest, providerResponse?.artifactType || 'image/png');
    if (storedArtifact.error) {
      return {
        status: STATUS.FAILED,
        error: storedArtifact.error,
        renderId: renderRequest?.renderId,
        payloadId: renderRequest?.payloadId,
        dayIdentity,
      };
    }
  }

  const finalArtifactUrl = artifactUrl || storedArtifact.artifactUrl;
  const finalArtifactPath = artifactPath || storedArtifact.artifactPath;
  const finalArtifactBlob = artifactBlob;
  const hasArtifact = Boolean(finalArtifactUrl || finalArtifactPath || finalArtifactBlob);

  if (!hasArtifact) {
    return {
      status: STATUS.FAILED,
      error: 'External renderer did not return artifactUrl, artifactPath, artifactBlob, or storable base64 artifact data.',
      renderId: renderRequest?.renderId,
      payloadId: renderRequest?.payloadId,
      dayIdentity,
    };
  }

  const artifactType = cleanText(providerResponse?.artifactType || providerResponse?.type || storedArtifact.artifactType) || 'image/png';
  return {
    status: STATUS.RENDERED,
    renderId: cleanText(providerResponse?.renderId) || renderRequest?.renderId,
    payloadId: cleanText(providerResponse?.payloadId) || renderRequest?.payloadId,
    artifactUrl: finalArtifactUrl,
    artifactPath: finalArtifactPath,
    artifactBlob: finalArtifactBlob,
    artifactType,
    dayIdentity,
    providerMetadata: {
      provider: getProviderName(),
      model: getModel(),
      responseId: providerResponse?.id || null,
      created: providerResponse?.created || null,
      storageMode: storedArtifact.storageMode || cleanText(process.env.DAY_CAPSULE_RENDER_STORAGE_MODE) || null,
      bucket: storedArtifact.bucket || null,
      urlType: storedArtifact.urlType || null,
      signedUrlExpiresIn: storedArtifact.signedUrlExpiresIn || null,
    },
    storageMode: storedArtifact.storageMode || cleanText(process.env.DAY_CAPSULE_RENDER_STORAGE_MODE) || null,
    renderArtifact: {
      artifactType,
      artifactUrl: finalArtifactUrl,
      artifactPath: finalArtifactPath,
      artifactBlob: finalArtifactBlob,
      url: finalArtifactUrl || finalArtifactPath,
    },
    createdAt: renderRequest?.createdAt || now,
    updatedAt: now,
  };
}

async function renderWithOpenAI(renderRequest) {
  const apiKey = cleanText(process.env.DAY_CAPSULE_RENDER_API_KEY);
  const model = getModel();
  const prompt = buildProviderPrompt(renderRequest);
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      size: DAY_CAPSULE_LANDSCAPE_SIZE,
      n: 1,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const providerReason = cleanText(result?.error?.message || result?.error || result?.message) || `Provider returned HTTP ${response.status}.`;
    const error = new Error(providerReason);
    error.providerStatus = response.status;
    error.providerReason = providerReason;
    error.providerCode = cleanText(result?.error?.code || result?.code);
    error.providerType = cleanText(result?.error?.type || result?.type);
    error.retryable = RETRYABLE_PROVIDER_STATUSES.has(response.status);
    throw error;
  }
  return result;
}

export async function renderDayCapsuleWithProvider(renderRequest) {
  if (!isDayCapsuleProviderConfigured()) {
    return {
      status: STATUS.NOT_CONFIGURED,
      error: 'External Day Capsule render provider is not configured.',
      providerReason: 'External Day Capsule render provider is not configured.',
      configured: false,
      configDiagnostic: getDayCapsuleRenderConfigDiagnostic(),
      missingConfig: getDayCapsuleRenderConfigDiagnostic().missingEnv,
      retryable: false,
      renderId: renderRequest?.renderId,
      payloadId: renderRequest?.payloadId,
    };
  }

  try {
    const provider = getProviderName();
    const providerResponse = provider === 'openai'
      ? await renderWithOpenAI(renderRequest)
      : null;
    if (!providerResponse) throw new Error(`Unsupported Day Capsule render provider: ${provider}.`);
    return normalizeProviderArtifact(providerResponse, renderRequest);
  } catch (error) {
    return {
      status: STATUS.FAILED,
      error: error?.message || 'External Day Capsule render provider failed.',
      providerReason: error?.providerReason || error?.message || 'External Day Capsule render provider failed.',
      providerStatus: error?.providerStatus || null,
      providerCode: error?.providerCode || null,
      providerType: error?.providerType || null,
      configured: true,
      retryable: error?.retryable ?? true,
      renderId: renderRequest?.renderId,
      payloadId: renderRequest?.payloadId,
      dayIdentity: renderRequest?.dayIdentity || null,
    };
  }
}
