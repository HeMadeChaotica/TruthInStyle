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

export async function verifySupabaseAccessToken(accessToken) {
  const config = getSupabaseAuthConfig();
  if (!config.configured) return { ok: false, configured: false, status: 503 };
  if (!accessToken) return { ok: false, configured: true, status: 401 };

  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  return { ok: response.ok, configured: true, status: response.status };
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

function getOAuthFailure(payload, fallback) {
  return {
    error: payload?.error || fallback,
    error_code: payload?.error_code || payload?.code || null,
    error_description: payload?.error_description || payload?.msg || payload?.message || null,
    message: payload?.message || payload?.msg || null,
  };
}

export async function exchangeOAuthCodeForSession(code, redirectTo) {
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
    body: JSON.stringify({ code, ...(redirectTo ? { redirect_to: String(redirectTo) } : {}) }),
    cache: 'no-store',
  });
  const payload = await parseJson(response);

  if (!response.ok || !payload?.access_token) {
    return { ok: false, status: response.status, ...getOAuthFailure(payload, 'oauth_code_exchange_failed') };
  }

  const verified = await verifySupabaseAccessToken(payload.access_token);
  if (!verified.ok) {
    return { ok: false, status: verified.status || 401, error: 'exchanged_session_verification_failed' };
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
  const verified = await verifySupabaseAccessToken(session.access_token);
  if (!verified.ok) {
    return { ok: false, status: verified.status || 401, error: 'invalid_access_token' };
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

  return verifySupabaseAccessToken(accessToken);
}
