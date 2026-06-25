import { randomUUID } from 'crypto';

function cleanText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function getSupabaseUrl() {
  return cleanText(process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/+$/, '') || null;
}

function getServiceRoleKey() {
  return cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getBucketName() {
  return cleanText(process.env.DAY_CAPSULE_SUPABASE_BUCKET) || 'day-capsules';
}

function sanitizePathSegment(value, fallback) {
  return (cleanText(value) || fallback).replace(/[^a-z0-9._-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || fallback;
}

function contentTypeToExtension(contentType = '') {
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  return 'png';
}

export function isSupabaseArtifactStorageConfigured() {
  return Boolean(getSupabaseUrl() && getServiceRoleKey() && getBucketName());
}

export function buildDayCapsuleStoragePath(renderRequest, extension = 'png') {
  const sourceDate = sanitizePathSegment(renderRequest?.dayIdentity?.sourceDate, 'unsourced');
  const renderId = sanitizePathSegment(renderRequest?.renderId, randomUUID());
  const safeExtension = sanitizePathSegment(extension, 'png').replace(/^\.+/, '') || 'png';
  return `${sourceDate}/${renderId}.${safeExtension}`;
}

async function supabaseStorageFetch(path, options = {}) {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();
  const response = await fetch(`${supabaseUrl}/storage/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }
  if (!response.ok) {
    throw new Error(cleanText(body?.error || body?.message) || `Supabase Storage returned HTTP ${response.status}.`);
  }
  return body;
}

async function isBucketPublic(bucket) {
  const metadata = await supabaseStorageFetch(`bucket/${encodeURIComponent(bucket)}`, { method: 'GET' });
  return Boolean(metadata?.public);
}

export async function getDayCapsuleArtifactUrl(bucket, path) {
  const supabaseUrl = getSupabaseUrl();
  const encodedBucket = encodeURIComponent(bucket);
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');

  if (await isBucketPublic(bucket)) {
    return {
      artifactUrl: `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`,
      urlType: 'public',
    };
  }

  const expiresIn = Number(process.env.DAY_CAPSULE_SUPABASE_SIGNED_URL_TTL_SECONDS || 60 * 60 * 24 * 7);
  const signed = await supabaseStorageFetch(`object/sign/${encodedBucket}/${encodedPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn }),
  });
  const signedPath = cleanText(signed?.signedURL || signed?.signedUrl || signed?.url);
  if (!signedPath) throw new Error('Supabase Storage did not return a signed URL.');
  return {
    artifactUrl: signedPath.startsWith('http') ? signedPath : `${supabaseUrl}/storage/v1${signedPath}`,
    urlType: 'signed',
    expiresIn,
  };
}

export async function uploadDayCapsuleArtifactToSupabase(base64Data, renderRequest, contentType = 'image/png') {
  if (!isSupabaseArtifactStorageConfigured()) throw new Error('Supabase Day Capsule artifact storage is not configured.');
  const bucket = getBucketName();
  const extension = contentTypeToExtension(contentType);
  const artifactPath = buildDayCapsuleStoragePath(renderRequest, extension);
  const buffer = Buffer.from(base64Data, 'base64');
  if (!buffer.length) throw new Error('Provider returned empty base64 artifact data.');

  await supabaseStorageFetch(`object/${encodeURIComponent(bucket)}/${artifactPath.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'Cache-Control': '31536000',
      'x-upsert': 'false',
    },
    body: buffer,
  });

  const urlResult = await getDayCapsuleArtifactUrl(bucket, artifactPath);
  return {
    bucket,
    artifactPath,
    artifactUrl: urlResult.artifactUrl,
    artifactType: contentType,
    storageMode: 'supabase',
    urlType: urlResult.urlType,
    signedUrlExpiresIn: urlResult.expiresIn || null,
  };
}
