'use client';

const CLIENTS_KEY = 'thicc_clients';
const LOGS_KEY = 'thicc_client_logs';
const MEDIA_KEY = 'media_library';
const FORMS_KEY = 'thicc_client_forms';
const ASSIGNMENTS_KEY = 'thicc_client_form_assignments';
const SCHEDULE_KEY = 'thicc_client_schedule_entries';

const uid = () => Math.random().toString(36).slice(2, 10);

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
  id: `THICC-${Date.now().toString().slice(-6)}`,
  name: 'thicc.fitt', phone: '', sex: '', sexualOrientation: '', height: '', age: '', email: '', relationshipStatus: 'SINGLE',
  clientColorOptionKey: 'cobalt', photo: '', currentWeight: '', goalWeight: '', currentBmi: '', goalBmi: '',
  food1: '', food2: '', food3: '', food4: '', food5: '', move1: '', move2: '', move3: '', move4: '', activity: '',
  emergencyContact: '', injuries: '', surgeries: '', allergies: '', medications: '', limits: '', painfulMovements: '', flexibility: '', hardNos: '', trainingFears: '',
  macro_protein: '', macro_carbs: '', macro_fats: '', macro_water: '', macro_calories: '',
  juice_substance: '', juice_amount: '', juice_cycle: '', juice_location: '', juice_notes: '',
  seasonsPerWeek: '', referrals: [{ name: '', date: '', status: '', notes: '' }],
  trainingRest: Array.from({ length: 7 }, () => 'TRAINING'), programSplit: Array.from({ length: 7 }, () => 'FULLBODY'),
  eventNotes: '', paymentDate: '', thoughts: '', myfitMeals: '', myfitVerified: false, celebration: createCelebration(), active: true,
});

const get = (k, fb) => { if (typeof window === 'undefined') return fb; try { return JSON.parse(localStorage.getItem(k) || 'null') ?? fb; } catch { return fb; } };
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const resolveClientColor = (key) => CONTROLLED_CLIENT_COLORS.find((c) => c.key === key) || CONTROLLED_CLIENT_COLORS[0];

export function loadClients() {
  const clients = get(CLIENTS_KEY, []);
  if (!clients.length) {
    const seeded = [createClientTemplate()];
    set(CLIENTS_KEY, seeded);
    return seeded;
  }
  return clients.map((c) => ({ ...c, celebration: Array.isArray(c.celebration) ? c.celebration : createCelebration() }));
}
export const saveClients = (clients) => set(CLIENTS_KEY, clients);
export const loadForms = () => get(FORMS_KEY, DEFAULT_FORMS);
export const saveForms = (forms) => set(FORMS_KEY, forms);
export const loadAssignments = () => get(ASSIGNMENTS_KEY, []);
export const saveAssignments = (assignments) => set(ASSIGNMENTS_KEY, assignments);
export const loadScheduleEntries = () => get(SCHEDULE_KEY, []);
export const saveScheduleEntries = (entries) => set(SCHEDULE_KEY, entries);

export function addClient() {
  const clients = loadClients();
  const fresh = createClientTemplate();
  fresh.id = `THICC-${uid().toUpperCase()}`;
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
