'use client';

const STORAGE_KEY = 'remember_me_entries_v1';

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sbAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Working records are synchronized by the authenticated CloudStateBridge.
// The legacy direct-browser table is not part of the live schema and RLS correctly
// blocks anonymous writes, so do not route production saves through the anon key.
const hasSupabase = false;
const sbHeaders = {
  apikey: sbAnon || '',
  Authorization: `Bearer ${sbAnon || ''}`,
  'Content-Type': 'application/json',
};

const uid = () => Math.random().toString(36).slice(2, 10);
const localId = () => `local_remember_${Date.now()}_${uid()}`;
const nowIso = () => new Date().toISOString();

const get = () => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const set = (rows) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
};

export const loadLocalEntries = () => get().map(normalizeRow);

async function readErrorBody(res) {
  try { return (await res.text()) || '<empty body>'; } catch { return '<unreadable body>'; }
}

function normalizeRow(row = {}) {
  const timestamp = nowIso();
  const createdAt = row.created_at || row.createdAt || timestamp;
  const updatedAt = row.updated_at || row.updatedAt || timestamp;
  const dateKey = row.date_key || row.date || '';
  const entryType = row.entry_type || row.type || 'SOMETHING NEW DAY';
  const timeValue = row.time_value || row.time || '';
  const detail = row.detail || row.location || '';

  return {
    id: row.id || localId(),
    date_key: dateKey,
    date: dateKey,
    entry_type: entryType,
    type: entryType,
    time_value: timeValue,
    time: timeValue,
    detail,
    location: detail,
    description: row.description || '',
    recurrence_type: row.recurrence_type || 'none',
    recurrence_days: Array.isArray(row.recurrence_days) ? row.recurrence_days : [],
    recurrence_active: Boolean(row.recurrence_active),
    created_at: createdAt,
    createdAt,
    updated_at: updatedAt,
    updatedAt,
  };
}

export async function fetchRememberMeEntriesSafe() {
  const local = loadLocalEntries();
  if (!hasSupabase) return { rows: local, error: null, source: 'local' };
  try {
    const res = await fetch(`${sbUrl}/rest/v1/remember_me_entries?select=*&order=date_key.asc,updated_at.asc`, { headers: sbHeaders, cache: 'no-store' });
    if (!res.ok) {
      const body = await readErrorBody(res);
      return { rows: local, error: `REMEMBER.ME sync diagnostic: ${res.status} ${body}`, source: 'local-fallback' };
    }
    const rows = await res.json();
    return { rows: Array.isArray(rows) ? rows.map(normalizeRow) : [], error: null, source: 'supabase' };
  } catch (error) {
    return { rows: local, error: `REMEMBER.ME sync diagnostic: ${error?.message || 'Unknown load error'}`, source: 'local-fallback' };
  }
}

export function upsertRememberMeLocal(entry) {
  const rows = loadLocalEntries();
  const existing = rows.find((row) => row.id === entry?.id);
  const safe = normalizeRow({
    ...existing,
    ...entry,
    id: entry?.id || existing?.id || localId(),
    created_at: entry?.created_at || entry?.createdAt || existing?.created_at || existing?.createdAt || nowIso(),
    updated_at: nowIso(),
  });
  const next = rows.some((row) => row.id === safe.id) ? rows.map((row) => row.id === safe.id ? safe : row) : [...rows, safe];
  set(next);
  return safe;
}

export async function upsertRememberMeEntry(entry) {
  const localSaved = upsertRememberMeLocal(entry);
  if (!hasSupabase) return localSaved;
  const payload = {
    id: localSaved.id.startsWith('local_remember_') ? undefined : localSaved.id,
    date_key: localSaved.date_key,
    entry_type: localSaved.entry_type,
    time_value: localSaved.time_value || null,
    detail: localSaved.detail || null,
    description: localSaved.description || null,
    recurrence_type: localSaved.recurrence_type || 'none',
    recurrence_days: Array.isArray(localSaved.recurrence_days) ? localSaved.recurrence_days : [],
    recurrence_active: Boolean(localSaved.recurrence_active),
    updated_at: nowIso(),
  };
  if (!payload.id) delete payload.id;
  try {
    const res = await fetch(`${sbUrl}/rest/v1/remember_me_entries`, { method: 'POST', headers: { ...sbHeaders, Prefer: 'return=representation,resolution=merge-duplicates' }, body: JSON.stringify([payload]) });
    if (!res.ok) {
      const body = await readErrorBody(res);
      console.warn(`REMEMBER.ME SAVE USING LOCAL FALLBACK: ${res.status} ${body}`);
      return { ...localSaved, source: 'local-fallback', syncError: `REMEMBER.ME SAVE FAILED: ${res.status} ${body}` };
    }
    const rows = await res.json();
    return normalizeRow(rows?.[0] || localSaved);
  } catch (error) {
    console.warn('REMEMBER.ME SAVE USING LOCAL FALLBACK', error);
    return { ...localSaved, source: 'local-fallback', syncError: `REMEMBER.ME SAVE FAILED: ${error?.message || 'Unknown save error'}` };
  }
}

export function deleteRememberMeLocal(id) {
  const next = loadLocalEntries().filter((row) => row.id !== id);
  set(next);
}

export async function deleteRememberMeEntry(id) {
  deleteRememberMeLocal(id);
  if (!hasSupabase) return true;
  const res = await fetch(`${sbUrl}/rest/v1/remember_me_entries?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: { ...sbHeaders, Prefer: 'return=minimal' } });
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new Error(`REMEMBER.ME DELETE FAILED: ${res.status} ${body}`);
  }
  return true;
}
