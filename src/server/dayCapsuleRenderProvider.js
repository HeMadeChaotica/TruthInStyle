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
    'Create one full-page illustrated Day Capsule artifact from the supplied real Day Capsule payload only.',
    'Style: visual journal / sketchnote / editorial memory-page. Use object-led accents only when they are supported by actual day content.',
    'Build a readable hierarchy with personal memory-page composition. Do not make a generic dashboard, raw metadata dump, API panel, or corporate report.',
    'Do not invent events, people, places, meals, workouts, reminders, emotions, or objects that are not present in the payload.',
    'Do not rely on generated image text for the permanent Day Identity Clump. Leave clean visual space for the app-owned identity clump overlay/preservation.',
    'The app owns and deterministically preserves this identity clump: titleOfDay, displayDate in MM/DD/YYYY, fully spelled dayOfWeek, and chaoticaDayNumber.',
    'Preserve the Day Identity Clump values exactly in metadata reasoning, but avoid attempting to render those exact identity words as the source of truth in the image.',
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
      size: cleanText(process.env.DAY_CAPSULE_RENDER_SIZE) || '1024x1536',
      n: 1,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(cleanText(result?.error?.message || result?.error || result?.message) || `Provider returned HTTP ${response.status}.`);
  }
  return result;
}

export async function renderDayCapsuleWithProvider(renderRequest) {
  if (!isDayCapsuleProviderConfigured()) {
    return {
      status: STATUS.NOT_CONFIGURED,
      error: 'External Day Capsule render provider is not configured.',
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
      renderId: renderRequest?.renderId,
      payloadId: renderRequest?.payloadId,
      dayIdentity: renderRequest?.dayIdentity || null,
    };
  }
}
