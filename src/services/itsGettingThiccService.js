'use client';

const CLIENTS_KEY = 'thicc_clients';
const LOGS_KEY = 'thicc_client_logs';
const MEDIA_KEY = 'media_library';
const FORMS_KEY = 'thicc_client_forms';
const ASSIGNMENTS_KEY = 'thicc_client_form_assignments';
const SCHEDULE_KEY = 'thicc_client_schedule_entries';

const uid = () => Math.random().toString(36).slice(2, 10);
const createLocalScheduleId = () => `local_schedule_${Date.now()}_${uid()}`;

export const CONTROLLED_CLIENT_COLORS = [
  ['cobalt', 'COBALT', '#3b82f6'], ['emerald', 'EMERALD', '#10b981'], ['amber', 'AMBER', '#f59e0b'], ['violet', 'VIOLET', '#8b5cf6'],
  ['teal', 'TEAL', '#14b8a6'], ['indigo', 'INDIGO', '#6366f1'], ['slate', 'SLATE', '#64748b'], ['orange', 'ORANGE', '#f97316'],
  ['cyan', 'CYAN', '#06b6d4'], ['lime', 'LIME', '#84cc16'], ['sky', 'SKY', '#0ea5e9'], ['navy', 'NAVY', '#1e3a8a'],
  ['plum', 'PLUM', '#7e22ce'], ['gold', 'GOLD', '#ca8a04'], ['olive', 'OLIVE', '#65a30d'], ['mint', 'MINT', '#34d399'],
  ['aqua', 'AQUA', '#22d3ee'], ['steel', 'STEEL', '#475569'], ['chocolate', 'CHOCOLATE', '#92400e'], ['sand', 'SAND', '#d97706'],
  ['forest', 'FOREST', '#166534'], ['sea', 'SEA', '#0f766e'], ['ice', 'ICE', '#0891b2'], ['storm', 'STORM', '#334155'],
  ['royal', 'ROYAL', '#4338ca'], ['orchid', 'ORCHID', '#9333ea'], ['ruby2', 'RUBY', '#b91c1c'], ['brick', 'BRICK', '#c2410c'],
  ['sage', 'SAGE', '#4d7c0f'], ['ocean', 'OCEAN', '#0369a1'],
].map(([key, label, value]) => ({ key, label, value }));

const DEFAULT_FORMS = [
  { id: 'intake', form_key: 'intake', formName: 'INTAKE DOSSIER', formCategory: 'ONBOARDING', active: true },
  { id: 'movement', form_key: 'movement-screen', formName: 'MOVEMENT SCREEN', formCategory: 'ASSESSMENT', active: true },
  { id: 'checkin', form_key: 'weekly-checkin', formName: 'WEEKLY CHECK-IN', formCategory: 'OPERATIONS', active: true },
];

const createCelebration = () => Array.from({ length: 10 }, (_, i) => ({ id: `tile-${i + 1}`, text: '', media: '' }));

export const createClientTemplate = () => ({
  id: `local_${uid()}`,
  name: 'thicc.fitt', phone: '', sex: '', sexualOrientation: '', height: '', age: '', email: '', relationshipStatus: 'SINGLE',
  clientColorOptionKey: 'cobalt', photo: '', currentWeight: '', goalWeight: '', currentBmi: '', goalBmi: '',
  food1: '', food2: '', food3: '', food4: '', food5: '', move1: '', move2: '', move3: '', move4: '', activity: '',
  emergencyContact: '', injuries: '', surgeries: '', allergies: '', medications: '', limits: '', painfulMovements: '', flexibility: '', hardNos: '', trainingFears: '',
  macro_protein: '', macro_carbs: '', macro_fats: '', macro_water: '', macro_calories: '',
  juice_substance: '', juice_ester: '', juice_amount: '', juice_shot: '', juice_sensitivity: '', juice_cycle: '', juice_location: '', juice_notes: '',
  seasonsPerWeek: '', referrals: [{ name: '', date: '', status: '', notes: '' }],
  trainingRest: Array.from({ length: 7 }, () => 'TRAINING'), programSplit: Array.from({ length: 7 }, () => 'FULLBODY'),
  eventNotes: '', paymentDate: '', thoughts: '', myfitMeals: '', myfitVerified: false, celebration: createCelebration(), active: true,
});

const get = (k, fb) => {
  if (typeof window === 'undefined') return fb;
  try {
    return JSON.parse(localStorage.getItem(k) || 'null') ?? fb;
  } catch (error) {
    console.warn(`ITS.GETTING.THICC localStorage parse failed for ${k}`, error);
    return fb;
  }
};
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const resolveClientColor = (key) => CONTROLLED_CLIENT_COLORS.find((c) => c.key === key) || CONTROLLED_CLIENT_COLORS[0] || { key: 'cobalt', label: 'COBALT', value: '#3b82f6' };

const normalizeCelebration = (value) => {
  const safeTiles = Array.from({ length: 10 }, (_, i) => ({
    id: `tile-${i + 1}`,
    text: '',
    media: '',
  }));
  if (!Array.isArray(value)) return safeTiles;
  return safeTiles.map((tile, index) => ({
    ...tile,
    ...(value[index] && typeof value[index] === 'object' ? value[index] : {}),
  }));
};

const normalizeClient = (client = {}) => {
  const base = createClientTemplate();
  const safeClient = client && typeof client === 'object' ? client : {};
  return {
    ...base,
    ...safeClient,
    id: typeof safeClient.id === 'string' && safeClient.id ? safeClient.id : base.id,
    name: typeof safeClient.name === 'string' && safeClient.name ? safeClient.name : base.name,
    clientColorOptionKey: resolveClientColor(safeClient.clientColorOptionKey).key,
    referrals: Array.isArray(safeClient.referrals) && safeClient.referrals.length
      ? safeClient.referrals.map((row) => ({ name: row?.name || '', date: row?.date || '', status: row?.status || '', notes: row?.notes || '' }))
      : [{ name: '', date: '', status: '', notes: '' }],
    trainingRest: Array.from({ length: 7 }, (_, i) => safeClient.trainingRest?.[i] || 'TRAINING'),
    programSplit: Array.from({ length: 7 }, (_, i) => safeClient.programSplit?.[i] || 'FULLBODY'),
    celebration: normalizeCelebration(safeClient.celebration),
    myfitVerified: Boolean(safeClient.myfitVerified),
    active: safeClient.active !== false,
  };
};

export function loadClients() {
  const rawClients = get(CLIENTS_KEY, []);
  const clients = Array.isArray(rawClients) ? rawClients : [];
  if (!clients.length) {
    const seeded = [createClientTemplate()];
    set(CLIENTS_KEY, seeded);
    return seeded;
  }
  return clients.filter(Boolean).map(normalizeClient);
}
export const saveClients = (clients) => set(CLIENTS_KEY, clients);
export const loadForms = () => get(FORMS_KEY, DEFAULT_FORMS);
export const saveForms = (forms) => set(FORMS_KEY, forms);
export const loadAssignments = () => get(ASSIGNMENTS_KEY, []);
export const saveAssignments = (assignments) => set(ASSIGNMENTS_KEY, assignments);
export const loadScheduleEntries = () => get(SCHEDULE_KEY, []);
export const saveScheduleEntries = (entries) => set(SCHEDULE_KEY, entries);

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sbAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sbHeaders = { apikey: sbAnon || '', Authorization: `Bearer ${sbAnon || ''}`, 'Content-Type': 'application/json' };
const hasSupabase = Boolean(sbUrl && sbAnon);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const isUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value.trim());

export function getClientDbId(client) {
  if (!client || typeof client !== 'object') return null;
  const candidates = [client.dbId, client.db_id, client.client_id, client.uuid];
  for (const candidate of candidates) {
    if (isUuid(candidate)) return candidate;
  }
  return isUuid(client.id) ? client.id : null;
}

export function normalizeForm(row = {}) {
  return {
    ...row,
    dbId: row.id,
    formName: row.form_name ?? row.formName ?? row.form_key,
    formCategory: row.form_category ?? row.formCategory ?? '',
    formKey: row.form_key ?? row.formKey ?? row.id,
  };
}

export function normalizeAssignment(row = {}) {
  return {
    ...row,
    clientId: row.clientId ?? row.client_id ?? '',
    formId: row.formId ?? row.form_id ?? '',
  };
}


export async function ensureClientDbId(client) {
  if (!hasSupabase) return client;
  if (!client || typeof client !== 'object') throw new Error('Cannot resolve client UUID: missing active client.');
  const existing = getClientDbId(client);
  if (existing) return { ...client, dbId: existing };

  const displayName = client.name || client.display_name || 'THICC CLIENT';
  const safeDisplayName = encodeURIComponent(displayName);
  const lookupRes = await fetch(`${sbUrl}/rest/v1/thicc_clients?select=id,display_name&display_name=eq.${safeDisplayName}&order=created_at.desc&limit=1`, { headers: sbHeaders, cache: 'no-store' });
  if (lookupRes.ok) {
    const rows = await lookupRes.json();
    const match = rows?.[0];
    if (isUuid(match?.id)) return { ...client, dbId: match.id };
  }

  const payload = {
    display_name: displayName,
    status: client.active === false ? 'inactive' : 'active',
    active: client.active !== false,
  };
  const createRes = await fetch(`${sbUrl}/rest/v1/thicc_clients`, { method: 'POST', headers: { ...sbHeaders, Prefer: 'return=representation' }, body: JSON.stringify([payload]) });
  if (!createRes.ok) {
    throw new Error('Cannot resolve client UUID: failed creating thicc_clients row.');
  }
  const createdRows = await createRes.json();
  const created = createdRows[0];
  if (!isUuid(created?.id)) throw new Error('Cannot resolve client UUID: invalid database ID.');
  return { ...client, dbId: created.id };
}


async function readErrorBody(res) {
  try {
    return (await res.text()) || '<empty body>';
  } catch {
    return '<unreadable body>';
  }
}

async function throwSupabaseError(action, res) {
  const body = await readErrorBody(res);
  throw new Error(`THICC.TIME ${action} FAILED: ${res.status} ${body}`);
}

export async function fetchScheduleEntries() {
  if (!hasSupabase) return loadScheduleEntries().map(normalizeScheduleEntry);
  const res = await fetch(`${sbUrl}/rest/v1/thicc_client_schedule_entries?select=*&order=entry_date.asc,start_time.asc`, { headers: sbHeaders, cache: 'no-store' });
  if (!res.ok) await throwSupabaseError('LOAD', res);
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map(normalizeScheduleEntry);
}

export function normalizeScheduleEntry(row = {}) {
  return {
    id: row.id || createLocalScheduleId(),
    client_id: row.client_id ?? null,
    client_name: row.client_name || '',
    entry_type: row.entry_type || 'client',
    schedule_layer: row.schedule_layer || (row.entry_type === 'personal' ? 'mista_thicc' : 'the_thiccens'),
    entry_date: row.entry_date || '',
    start_time: row.start_time || '',
    end_time: row.end_time || '',
    workout_label: row.workout_label || '',
    source_split_day: row.source_split_day || '',
    prospect_name: row.prospect_name || '',
    prospect_contact: row.prospect_contact || '',
    location: row.location || '',
    notes: row.notes || '',
    color_option_key: row.color_option_key || 'cobalt',
    recurrence_type: row.recurrence_type || 'none',
    recurrence_days: Array.isArray(row.recurrence_days) ? row.recurrence_days : [],
    recurrence_active: Boolean(row.recurrence_active),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

export function groupScheduleEntriesByDate(rows = []) {
  const safeRows = Array.isArray(rows) ? rows : [];
  return safeRows.reduce((acc, row) => {
    const normalized = normalizeScheduleEntry(row);
    if (!normalized.entry_date) return acc;
    acc[normalized.entry_date] = [...(acc[normalized.entry_date] || []), normalized];
    return acc;
  }, {});
}

const formatDisplayDate = (isoDate) => {
  if (!isoDate || typeof isoDate !== 'string') return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return '';
  return `${month}/${day}/${year}`;
};

export function buildThiccTimeAssurerPayload(entriesByDate = {}, fromDate = new Date()) {
  const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const safeEntriesByDate = entriesByDate && typeof entriesByDate === 'object' ? entriesByDate : {};
  const entries = [];
  Object.values(safeEntriesByDate).forEach((rows) => {
    (Array.isArray(rows) ? rows : []).forEach((entry) => {
      const normalized = normalizeScheduleEntry(entry);
      const recurrenceDays = Array.isArray(normalized.recurrence_days) ? normalized.recurrence_days : [];
      const pushEntry = (dateKey) => {
        entries.push({
          date: dateKey,
          displayDate: formatDisplayDate(dateKey),
          scheduleLayer: normalized.schedule_layer,
          entryType: normalized.entry_type,
          clientId: normalized.schedule_layer === 'the_thiccens' ? normalized.client_id : null,
          clientName: normalized.client_name || '',
          prospectName: normalized.prospect_name || '',
          title: normalized.workout_label || '',
          startTime: normalized.start_time || '',
          endTime: normalized.end_time || '',
          location: normalized.location || '',
          description: normalized.notes || '',
          recurrenceType: normalized.recurrence_type || 'none',
          recurrenceDays: recurrenceDays,
          recurrenceActive: Boolean(normalized.recurrence_active),
          colorOptionKey: normalized.color_option_key || 'cobalt',
        });
      };
      const entryDay = new Date(`${normalized.entry_date}T12:00:00`);
      if (Number.isNaN(entryDay.getTime())) return;
      if (normalized.recurrence_type === 'weekly' && normalized.recurrence_active && recurrenceDays.length) {
        for (let i = 0; i < 7; i += 1) {
          const candidate = new Date(start);
          candidate.setDate(start.getDate() + i);
          if (candidate < entryDay) continue;
          const weekdayKey = WEEKDAY_KEYS[candidate.getDay()];
          if (!recurrenceDays.includes(weekdayKey)) continue;
          const dateKey = candidate.toISOString().slice(0, 10);
          pushEntry(dateKey);
        }
        return;
      }
      if (entryDay < start || entryDay > end) return;
      pushEntry(normalized.entry_date);
    });
  });
  entries.sort((a, b) => (a.date === b.date ? String(a.startTime).localeCompare(String(b.startTime)) : String(a.date).localeCompare(String(b.date))));
  return { source: 'THICC.TIME', range: '7_DAY', entries };
}

export async function saveScheduleEntry(entry) {
  const allowedScheduleKeys = [
    'id',
    'client_id',
    'client_name',
    'entry_type',
    'schedule_layer',
    'entry_date',
    'start_time',
    'end_time',
    'workout_label',
    'source_split_day',
    'prospect_name',
    'prospect_contact',
    'location',
    'notes',
    'color_option_key',
    'recurrence_type',
    'recurrence_days',
    'recurrence_active',
    'created_at',
    'updated_at',
  ];
  const cleanPayload = Object.fromEntries(
    Object.entries(entry || {}).filter(([key, value]) => allowedScheduleKeys.includes(key) && value !== undefined),
  );

  if (hasSupabase) {
    if (cleanPayload.entry_type === 'client' && !isUuid(cleanPayload.client_id)) {
      throw new Error('Cannot save THICC.TIME entry: active client is missing a database UUID.');
    }
  }
  if (!hasSupabase) {
    const safeEntry = {
      ...cleanPayload,
      id: cleanPayload.id || createLocalScheduleId(),
      created_at: cleanPayload.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const existing = loadScheduleEntries();
    const next = existing.some((row) => row.id === safeEntry.id)
      ? existing.map((row) => (row.id === safeEntry.id ? safeEntry : row))
      : [...existing, safeEntry];
    saveScheduleEntries(next);
    return safeEntry;
  }
  const hasExistingId = isUuid(cleanPayload.id);
  if (!hasExistingId) delete cleanPayload.id;
  const res = await fetch(`${sbUrl}/rest/v1/thicc_client_schedule_entries`, { method: 'POST', headers: { ...sbHeaders, Prefer: 'return=representation,resolution=merge-duplicates' }, body: JSON.stringify([cleanPayload]) });
  if (!res.ok) await throwSupabaseError('SAVE', res);
  const rows = await res.json();
  return rows[0];
}

export async function deleteScheduleEntry(id) {
  if (!hasSupabase) {
    const next = loadScheduleEntries().filter((row) => row.id !== id);
    saveScheduleEntries(next);
    return true;
  }
  const res = await fetch(`${sbUrl}/rest/v1/thicc_client_schedule_entries?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: { ...sbHeaders, Prefer: 'return=minimal' } });
  if (!res.ok) await throwSupabaseError('DELETE', res);
  return true;
}

export async function fetchClientColors() {
  if (!hasSupabase) return CONTROLLED_CLIENT_COLORS;
  const res = await fetch(`${sbUrl}/rest/v1/clockit_option_sets?select=option_key,option_label,option_value&group_key=eq.thicc_client_colors&active=eq.true&order=display_order.asc`, { headers: sbHeaders, cache: 'no-store' });
  if (!res.ok) return CONTROLLED_CLIENT_COLORS;
  const rows = await res.json();
  return rows.map((r) => ({ key: r.option_key, label: r.option_label, value: r.option_value }));
}

export async function fetchForms() {
  if (!hasSupabase) return loadForms();
  const res = await fetch(`${sbUrl}/rest/v1/thicc_client_forms?select=*`, { headers: sbHeaders, cache: 'no-store' });
  if (!res.ok) return loadForms();
  const rows = await res.json();
  return rows.map(normalizeForm);
}

export async function fetchFormAssignments() {
  if (!hasSupabase) return loadAssignments();
  const res = await fetch(`${sbUrl}/rest/v1/thicc_client_form_assignments?select=*`, { headers: sbHeaders, cache: 'no-store' });
  if (!res.ok) return loadAssignments();
  const rows = await res.json();
  return rows.map(normalizeAssignment);
}

export async function upsertFormAssignment(assignment) {
  if (!hasSupabase) {
    const next = [...loadAssignments(), assignment];
    saveAssignments(next);
    return assignment;
  }
  const clientId = getClientDbId(assignment?.client);
  if (!clientId) throw new Error('Cannot assign form: active client is missing a database UUID.');
  const formId = assignment?.formDbId ?? assignment?.form_id ?? assignment?.formId;
  if (!formId) throw new Error('Cannot assign form: missing form ID.');
  const payload = {
    client_id: clientId,
    form_id: formId,
    status: assignment?.status || 'assigned',
    response_json: assignment?.response_json || assignment?.responseJson || {},
    notes: assignment?.notes || '',
    assigned_at: assignment?.assigned_at || assignment?.assignedAt || new Date().toISOString(),
  };
  const res = await fetch(`${sbUrl}/rest/v1/thicc_client_form_assignments`, { method: 'POST', headers: { ...sbHeaders, Prefer: 'return=representation,resolution=merge-duplicates' }, body: JSON.stringify([payload]) });
  if (!res.ok) throw new Error('Assignment upsert failed');
  const rows = await res.json();
  return normalizeAssignment(rows[0]);
}

export const isSupabaseEnabled = () => hasSupabase;

export function addClient() {
  const clients = loadClients();
  const fresh = createClientTemplate();
  fresh.id = `local_${uid()}`;
  fresh.name = `client-${clients.length + 1}`;
  const next = [...clients, fresh];
  saveClients(next);
  return fresh;
}

export function appendLog(event, payload = {}) {
  const logs = get(LOGS_KEY, []);
  const next = [{ id: uid(), event, payload, ts: new Date().toISOString() }, ...logs].slice(0, 3000);
  set(LOGS_KEY, next);
}

export function upsertMedia(clientId, slot, dataUrl) {
  const media = get(MEDIA_KEY, {}); media[clientId] = media[clientId] || {}; media[clientId][slot] = dataUrl; set(MEDIA_KEY, media); return dataUrl;
}
export function readMedia(clientId, slot) { const media = get(MEDIA_KEY, {}); return media?.[clientId]?.[slot] || ''; }
