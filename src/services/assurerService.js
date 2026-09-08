const ASSURER_FEED_KEY = 'the_assurer_feed';

function readFeed() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(ASSURER_FEED_KEY) || '[]'); } catch { return []; }
}

export function publishThiccFittSessionProof(payload) {
  if (typeof window === 'undefined') return;
  const feed = readFeed();
  const next = [
    ...feed.filter((entry) => !(entry?.source === 'thicc-fitt' && entry?.date === payload.date)),
    { source: 'thicc-fitt', createdAt: new Date().toISOString(), ...payload }
  ];
  localStorage.setItem(ASSURER_FEED_KEY, JSON.stringify(next));
}

export function getAssurerFeed() {
  return readFeed();
}
