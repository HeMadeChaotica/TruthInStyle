import { NextResponse } from 'next/server';
import { getChaoticaSession } from '../../../../src/server/chaoticaSupabaseAuth';

export const runtime = 'nodejs';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  if (cachedToken && tokenExpiresAt > Date.now() + 30_000) return cachedToken;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const error = new Error('SPOTIFY CONFIGURATION REQUIRED');
    error.code = 'spotify_not_configured';
    throw error;
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error('SPOTIFY AUTHENTICATION FAILED');
  cachedToken = payload.access_token;
  tokenExpiresAt = Date.now() + (Number(payload.expires_in || 3600) * 1000);
  return cachedToken;
}

export async function GET(request) {
  const session = await getChaoticaSession();
  if (!session.ok) return NextResponse.json({ error: 'A verified Supabase gate session is required.' }, { status: 401 });
  const query = new URL(request.url).searchParams.get('q')?.trim().slice(0, 120);
  if (!query) return NextResponse.json({ error: 'SEARCH QUERY REQUIRED' }, { status: 400 });

  try {
    const token = await getSpotifyToken();
    const spotifyResponse = await fetch(`https://api.spotify.com/v1/search?type=track&limit=8&market=US&q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const payload = await spotifyResponse.json();
    if (!spotifyResponse.ok) return NextResponse.json({ error: payload?.error?.message || 'SPOTIFY SEARCH FAILED' }, { status: spotifyResponse.status });

    const tracks = (payload?.tracks?.items || []).map((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artists?.map((artist) => artist.name).join(', ') || '',
      album: track.album?.name || '',
      image: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || '',
      spotifyUrl: track.external_urls?.spotify || '',
      uri: track.uri || '',
    }));
    return NextResponse.json({ tracks });
  } catch (error) {
    const status = error.code === 'spotify_not_configured' ? 503 : 502;
    return NextResponse.json({ error: error.message || 'SPOTIFY SEARCH UNAVAILABLE', code: error.code || 'spotify_search_failed' }, { status });
  }
}
