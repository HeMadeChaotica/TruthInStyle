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

export function getSupabaseAuthConfig() {
  const supabaseUrl = cleanText(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
  const anonKey = cleanText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return { supabaseUrl, anonKey, configured: Boolean(supabaseUrl && anonKey) };
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function setSessionCookies(session) {
  const cookieStore = await cookies();
  const maxAge = Math.max(60, Number(session?.expires_in || 3600));
  cookieStore.set(CHAOTICA_ACCESS_COOKIE, session.access_token, { ...SESSION_COOKIE_OPTIONS, maxAge });
  if (session.refresh_token) {
    cookieStore.set(CHAOTICA_REFRESH_COOKIE, session.refresh_token, {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

export function getGithubOAuthUrl(redirectTo) {
  const config = getSupabaseAuthConfig();
  if (!config.configured) return null;
  const url = new URL(`${config.supabaseUrl}/auth/v1/authorize`);
  url.searchParams.set('provider', 'github');
  url.searchParams.set('redirect_to', redirectTo);
  return url.toString();
}

export async function exchangeOAuthCodeForSession(code) {
  const config = getSupabaseAuthConfig();
  if (!config.configured) {
    return { ok: false, status: 503, error: 'supabase_auth_not_configured' };
  }

  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=authorization_code`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
    cache: 'no-store',
  });
  const payload = await parseJson(response);

  if (!response.ok || !payload?.access_token) {
    return { ok: false, status: response.status, error: payload?.error || 'oauth_code_exchange_failed' };
  }

  await setSessionCookies(payload);
  return { ok: true };
}

export async function persistOAuthSession(session) {
  const config = getSupabaseAuthConfig();
  if (!config.configured) {
    return { ok: false, status: 503, error: 'supabase_auth_not_configured' };
  }
  if (!session?.access_token) {
    return { ok: false, status: 400, error: 'missing_access_token' };
  }
  await setSessionCookies(session);
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

  if (!response.ok) {
    return { ok: false, configured: true };
  }

  return { ok: true, configured: true };
}
