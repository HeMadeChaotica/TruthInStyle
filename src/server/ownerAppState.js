const OWNER_KEY = 'truthinstyle-owner';

function cleanText(value) {
  return String(value ?? '').trim();
}

function config() {
  const url = cleanText(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
  const key = cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return { url, key, configured: Boolean(url && key) };
}

async function request(path, options = {}) {
  const current = config();
  if (!current.configured) throw new Error('TruthInStyle cloud state is not configured.');
  const response = await fetch(`${current.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: current.key,
      Authorization: `Bearer ${current.key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { message: text }; }
  if (!response.ok) throw new Error(cleanText(body?.message || body?.error) || `Cloud state returned HTTP ${response.status}.`);
  return body;
}

function validEntry(entry) {
  return entry
    && typeof entry === 'object'
    && (typeof entry.value === 'string' || entry.deleted === true)
    && Number.isFinite(Date.parse(entry.updatedAt));
}

function normalizeState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return {};
  return Object.fromEntries(Object.entries(state).filter(([key, entry]) => cleanText(key) && key.length <= 250 && validEntry(entry)));
}

export async function readOwnerAppState() {
  const rows = await request(`owner_app_state?select=state,updated_at&owner_key=eq.${encodeURIComponent(OWNER_KEY)}&limit=1`);
  const row = rows?.[0];
  return { state: normalizeState(row?.state), updatedAt: row?.updated_at || null };
}

export async function mergeOwnerAppState(incomingState) {
  const incoming = normalizeState(incomingState);
  const current = await readOwnerAppState();
  const merged = { ...current.state };
  Object.entries(incoming).forEach(([key, entry]) => {
    const existing = merged[key];
    if (!existing || Date.parse(entry.updatedAt) >= Date.parse(existing.updatedAt)) merged[key] = entry;
  });
  const rows = await request('owner_app_state?on_conflict=owner_key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ owner_key: OWNER_KEY, state: merged, updated_at: new Date().toISOString() }),
  });
  return { state: normalizeState(rows?.[0]?.state || merged), updatedAt: rows?.[0]?.updated_at || null };
}
