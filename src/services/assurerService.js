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

export async function getDailyAssurerWord() {
  try {
    const res = await fetch('https://random-word-api.herokuapp.com/word?number=1', { cache: 'no-store' });
    if (!res.ok) throw new Error('WORD FETCH FAILED');
    const rows = await res.json();
    const word = (rows?.[0] || 'VELVET RUCKUS').toUpperCase();
    return { word, definition: 'A SOFT-LOOKING SITUATION THAT IS ABSOLUTELY CAUSING A SCENE.', sourceLabel: 'RANDOM WORD API', fetchedAt: new Date().toISOString() };
  } catch {
    return { word: 'VELVET RUCKUS', definition: 'A SOFT-LOOKING SITUATION THAT IS ABSOLUTELY CAUSING A SCENE.', sourceLabel: 'FALLBACK', fetchedAt: new Date().toISOString() };
  }
}

export async function searchHeadHummer(query) {
  if (!query || query.length < 2) return null;
  return { id: `local_${query}`, title: query, artist: 'SPOTIFY READY', albumArt: '' };
}

export function selectHeadHummer(track) {
  return track ? { id: track.id, title: track.title, artist: track.artist, albumArt: track.albumArt || '' } : null;
}

export async function getAssurerWeather(location) {
  if (!location) return { locationLabel: '', condition: 'NEEDS WEATHER CONNECTION', iconKey: 'CLOUDS' };
  return { locationLabel: location, condition: 'NEEDS WEATHER CONNECTION', iconKey: 'CLOUDS' };
}
