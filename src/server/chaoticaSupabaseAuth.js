import { cookies } from 'next/headers';

export const CHAOTICA_ACCESS_COOKIE = 'chaotica-supabase-access';
export const CHAOTICA_REFRESH_COOKIE = 'chaotica-supabase-refresh';

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

function cleanText(value) {
  return String(value || '').trim();
}

function getSupabaseAuthConfig() {
  const supabaseUrl = cleanText(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
  const anonKey = cleanText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const ownerEmail = cleanText(process.env.CHAOTICA_OWNER_EMAIL || process.env.SUPABASE_AUTH_OWNER_EMAIL).toLowerCase();
  return { supabaseUrl, anonKey, ownerEmail, configured: Boolean(supabaseUrl && anonKey && ownerEmail) };
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function signInChaoticaOwner(password) {
  const config = getSupabaseAuthConfig();
  if (!config.configured) {
    return { ok: false, status: 503, error: 'supabase_auth_not_configured' };
  }

  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: config.ownerEmail, password }),
    cache: 'no-store',
  });
  const payload = await parseJson(response);
  const userEmail = cleanText(payload?.user?.email).toLowerCase();

  if (!response.ok || !payload?.access_token || userEmail !== config.ownerEmail) {
    return { ok: false, status: response.ok ? 403 : response.status, error: 'gate_authorization_failed' };
  }

  const cookieStore = await cookies();
  const maxAge = Math.max(60, Number(payload.expires_in || 3600));
  cookieStore.set(CHAOTICA_ACCESS_COOKIE, payload.access_token, { ...SESSION_COOKIE_OPTIONS, maxAge });
  if (payload.refresh_token) {
    cookieStore.set(CHAOTICA_REFRESH_COOKIE, payload.refresh_token, {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return { ok: true };
}

export async function getChaoticaSession() {
  const config = getSupabaseAuthConfig();
  if (!config.configured) return { ok: false, configured: false };

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(CHAOTICA_ACCESS_COOKIE)?.value;
  if (!accessToken) return { ok: false, configured: true };

  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });
  const payload = await parseJson(response);
  const userEmail = cleanText(payload?.email).toLowerCase();

  if (!response.ok || userEmail !== config.ownerEmail) {
    return { ok: false, configured: true };
  }

  return { ok: true, configured: true };
}
