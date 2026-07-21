'use client';

export async function uploadPrivateImage(file, { context = 'general', sourceDate = '' } = {}) {
  if (!file) throw new Error('Choose an image first.');
  const form = new FormData();
  form.append('file', file);
  form.append('context', context);
  form.append('sourceDate', sourceDate);
  const response = await fetch('/api/media', { method: 'POST', body: form });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `Image upload returned HTTP ${response.status}.`);
  return body;
}
