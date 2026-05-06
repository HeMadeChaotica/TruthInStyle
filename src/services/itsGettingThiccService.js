'use client';

const CLIENTS_KEY = 'thicc_clients';
const LOGS_KEY = 'thicc_client_logs';
const MEDIA_KEY = 'media_library';

const uid = () => Math.random().toString(36).slice(2, 10);

export const createClientTemplate = () => ({
  id: `THICC-${Date.now().toString().slice(-6)}`,
  name: 'thicc.fitt',
  phone: '', sex: '', orientation: '', heightFt: '', heightIn: '', heightCm: '', age: '', email: '', married: false, single: true,
  photo: '', currentWeight: '', goalWeight: '', currentBmi: '', goalBmi: '',
  food1: '', food2: '', food3: '', food4: '', food5: '',
  move1: '', move2: '', move3: '', move4: '', activity: '',
  medEmergency: '', medInjuries: '', medSurgeries: '', medAllergies: '', medMeds: '', medLimits: '', medPain: '', medFlex: '', medHardNo: '', medFears: '',
  macroProtein: '', macroCarbs: '', macroFats: '', macroWater: '', macroCalories: '',
  juiceSubstance: '', juiceShot: '', juiceCycle: '', juiceNotes: '',
  seasonsPerWeek: '',
  referrals: [{ name: '', date: '', bonusWeek: '' }],
  trainingRest: Array.from({ length: 7 }, () => 'Training'),
  programSplit: Array.from({ length: 7 }, () => 'FullBody'),
  upcomingEvents: [{ type: 'WEDDING', custom: '', date: '' }, { type: 'Birthday', custom: '', date: '' }],
  paymentSchedule: '', paymentDate: '', paymentNotes: '', thoughts: '',
  myfitMeals: '', myfitVerified: false, myfitNotes: '',
  celebration: Array.from({ length: 9 }, () => ''),
});

const get = (k, fb) => {
  if (typeof window === 'undefined') return fb;
  try { return JSON.parse(localStorage.getItem(k) || 'null') ?? fb; } catch { return fb; }
};
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export function loadClients() {
  const clients = get(CLIENTS_KEY, []);
  if (!clients.length) {
    const seeded = [createClientTemplate()];
    set(CLIENTS_KEY, seeded);
    return seeded;
  }
  return clients;
}

export function saveClients(clients) { set(CLIENTS_KEY, clients); }

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
  const media = get(MEDIA_KEY, {});
  media[clientId] = media[clientId] || {};
  media[clientId][slot] = dataUrl;
  set(MEDIA_KEY, media);
  return dataUrl;
}

export function readMedia(clientId, slot) {
  const media = get(MEDIA_KEY, {});
  return media?.[clientId]?.[slot] || '';
}
