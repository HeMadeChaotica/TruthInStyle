import { randomUUID } from 'crypto';

const BUCKET = 'truthinstyle-media';

function cleanText(value) {
  return String(value ?? '').trim();
}

function config() {
  const url = cleanText(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
  const key = cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return { url, key, configured: Boolean(url && key) };
}

function extension(contentType) {
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/gif') return 'gif';
  return 'png';
}

function safeSegment(value, fallback) {
  return (cleanText(value) || fallback).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || fallback;
}

async function storageFetch(path, options = {}) {
  const current = config();
  if (!current.configured) throw new Error('Private media storage is not configured.');
  return fetch(`${current.url}/storage/v1/${path}`, {
    ...options,
    headers: {
      apikey: current.key,
      Authorization: `Bearer ${current.key}`,
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });
}

async function insertMediaLibrary(path, contentType, metadata) {
  const current = config();
  const response = await fetch(`${current.url}/rest/v1/media_library`, {
    method: 'POST',
    headers: {
      apikey: current.key,
      Authorization: `Bearer ${current.key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ media_path: path, media_type: contentType, metadata }),
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(cleanText(body?.message || body?.error) || `Media library returned HTTP ${response.status}.`);
  return body?.[0] || null;
}

export async function uploadPrivateMedia(buffer, { contentType, context, sourceDate, originalName }) {
  const folder = safeSegment(context, 'general');
  const date = safeSegment(sourceDate, new Date().toISOString().slice(0, 10));
  const path = `${folder}/${date}/${randomUUID()}.${extension(contentType)}`;
  const response = await storageFetch(`object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: { 'Content-Type': contentType, 'Cache-Control': '31536000', 'x-upsert': 'false' },
    body: buffer,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(cleanText(body?.message || body?.error) || `Media upload returned HTTP ${response.status}.`);
  }
  const row = await insertMediaLibrary(path, contentType, { context: folder, sourceDate: date, originalName: cleanText(originalName) || null });
  return { id: row?.id || null, path, contentType, url: `/api/media?path=${encodeURIComponent(path)}` };
}

export async function readPrivateMedia(path) {
  const safePath = cleanText(path).replace(/^\/+/, '');
  if (!safePath || safePath.includes('..')) throw new Error('Invalid private media path.');
  const response = await storageFetch(`object/${BUCKET}/${safePath.split('/').map(encodeURIComponent).join('/')}`, { method: 'GET' });
  if (!response.ok) throw new Error(`Private media returned HTTP ${response.status}.`);
  return { bytes: await response.arrayBuffer(), contentType: response.headers.get('content-type') || 'application/octet-stream' };
}
