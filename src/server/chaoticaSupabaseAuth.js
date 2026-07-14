import { cookies } from 'next/headers';

export const CHAOTICA_ACCESS_COOKIE = 'chaotica-supabase-session-access';
export const CHAOTICA_REFRESH_COOKIE = 'chaotica-supabase-session-refresh';
export const LEGACY_CHAOTICA_ACCESS_COOKIE = 'chaotica-supabase-access';
export const LEGACY_CHAOTICA_REFRESH_COOKIE = 'chaotica-supabase-refresh';

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

export async function clearChaoticaAuthCookies() {
  const cookieStore = await cookies();
  [
    CHAOTICA_ACCESS_COOKIE,
    CHAOTICA_REFRESH_COOKIE,
    LEGACY_CHAOTICA_ACCESS_COOKIE,
    LEGACY_CHAOTICA_REFRESH_COOKIE,
  ].forEach((name) => cookieStore.delete(name));
}

export async function verifySupabaseAccessToken(accessToken) {
  const config = getSupabaseAuthConfig();
  if (!config.configured) return { ok: false, configured: false, status: 503, error: 'supabase_auth_not_configured' };
  if (!accessToken) return { ok: false, configured: true, status: 401, error: 'missing_supabase_session_access_token' };
  if (accessToken === config.anonKey) {
    return { ok: false, configured: true, status: 401, error: 'anon_key_is_not_user_session_token' };
  }

  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });
  const payload = response.ok ? null : await parseJson(response);

  return {
    ok: response.ok,
    configured: true,
    status: response.status,
    error: response.ok ? null : 'invalid_supabase_session_access_token',
    error_description: payload?.msg || payload?.message || payload?.error_description || null,
  };
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
  cookieStore.delete(LEGACY_CHAOTICA_ACCESS_COOKIE);
  cookieStore.delete(LEGACY_CHAOTICA_REFRESH_COOKIE);
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
    await clearChaoticaAuthCookies();
    return { ok: false, status: 503, error: 'supabase_auth_not_configured' };
  }

  const cleanCode = cleanText(code);
  if (!cleanCode) {
    await clearChaoticaAuthCookies();
    return { ok: false, status: 400, error: 'missing_oauth_code' };
  }

  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=authorization_code`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: cleanCode, ...(redirectTo ? { redirect_to: String(redirectTo) } : {}) }),
    cache: 'no-store',
  });
  const payload = await parseJson(response);

  if (!response.ok || !payload?.access_token) {
    await clearChaoticaAuthCookies();
    return { ok: false, status: response.status, ...getOAuthFailure(payload, 'oauth_code_exchange_failed') };
  }

  const verified = await verifySupabaseAccessToken(payload.access_token);
  if (!verified.ok) {
    await clearChaoticaAuthCookies();
    return {
      ok: false,
      status: verified.status || 401,
      error: verified.error || 'exchanged_session_verification_failed',
      error_description: verified.error_description || null,
    };
  }

  await setSessionCookies(payload);
  return { ok: true };
}

export async function getChaoticaSession() {
  const config = getSupabaseAuthConfig();
  if (!config.configured) return { ok: false, configured: false, error: 'supabase_auth_not_configured' };

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(CHAOTICA_ACCESS_COOKIE)?.value;
  const legacyAccessToken = cookieStore.get(LEGACY_CHAOTICA_ACCESS_COOKIE)?.value;
  if (!accessToken) {
    if (legacyAccessToken) await clearChaoticaAuthCookies();
    return { ok: false, configured: true, error: 'missing_supabase_session_access_token' };
  }

  const verified = await verifySupabaseAccessToken(accessToken);
  if (!verified.ok) await clearChaoticaAuthCookies();
  return verified;
}
