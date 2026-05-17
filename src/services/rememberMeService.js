'use client';

const STORAGE_KEY = 'remember_me_entries_v1';

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sbAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabase = Boolean(sbUrl && sbAnon);
const sbHeaders = {
  apikey: sbAnon || '',
  Authorization: `Bearer ${sbAnon || ''}`,
  'Content-Type': 'application/json',
};

const uid = () => Math.random().toString(36).slice(2, 10);
const localId = () => `local_remember_${Date.now()}_${uid()}`;

const get = () => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const set = (rows) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
};

export const loadLocalEntries = () => get();

async function readErrorBody(res) {
  try { return (await res.text()) || '<empty body>'; } catch { return '<unreadable body>'; }
}

function normalizeRow(row = {}) {
  return {
    id: row.id || localId(),
    date_key: row.date_key || '',
    entry_type: row.entry_type || 'SOMETHING NEW DAY',
    time_value: row.time_value || '',
    detail: row.detail || '',
    description: row.description || '',
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

export async function fetchRememberMeEntriesSafe() {
  const local = loadLocalEntries();
  if (!hasSupabase) return { rows: local, error: null, source: 'local' };
  try {
    const res = await fetch(`${sbUrl}/rest/v1/remember_me_entries?select=*&order=date_key.asc,updated_at.asc`, { headers: sbHeaders, cache: 'no-store' });
    if (!res.ok) {
      const body = await readErrorBody(res);
      return { rows: local, error: `REMEMBER.ME LOAD FAILED: ${res.status} ${body}`, source: 'local-fallback' };
    }
    const rows = await res.json();
    return { rows: Array.isArray(rows) ? rows.map(normalizeRow) : [], error: null, source: 'supabase' };
  } catch (error) {
    return { rows: local, error: `REMEMBER.ME LOAD FAILED: ${error?.message || 'Unknown load error'}`, source: 'local-fallback' };
  }
}

export function upsertRememberMeLocal(entry) {
  const safe = normalizeRow({ ...entry, id: entry?.id || localId(), updated_at: new Date().toISOString() });
  const rows = loadLocalEntries();
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
    updated_at: new Date().toISOString(),
  };
  if (!payload.id) delete payload.id;
  const res = await fetch(`${sbUrl}/rest/v1/remember_me_entries`, { method: 'POST', headers: { ...sbHeaders, Prefer: 'return=representation,resolution=merge-duplicates' }, body: JSON.stringify([payload]) });
  if (!res.ok) {
    const body = await readErrorBody(res);
    throw new Error(`REMEMBER.ME SAVE FAILED: ${res.status} ${body}`);
  }
  const rows = await res.json();
  return normalizeRow(rows?.[0] || localSaved);
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
