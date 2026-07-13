export function sanitizeAuthNext(rawNext) {
  if (typeof rawNext !== 'string') return '/';
  const next = rawNext.trim();
  if (!next) return '/';
  if (!next.startsWith('/') || next.startsWith('//')) return '/';
  if (next.includes('\\')) return '/';

  try {
    if (decodeURIComponent(next).includes('\\')) return '/';
  } catch {
    return '/';
  }

  try {
    const parsed = new URL(next, 'http://truthinstyle.local');
    if (parsed.origin !== 'http://truthinstyle.local') return '/';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/';
  }
}
