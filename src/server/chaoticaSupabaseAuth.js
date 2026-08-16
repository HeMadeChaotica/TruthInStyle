import { cookies } from 'next/headers';
import { clearChaoticaPasswordGateCookie, getChaoticaPasswordSession } from './chaoticaPasswordGate';

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

function normalizeEmail(value) {
  return cleanText(value).toLowerCase();
}

export function getSupabaseAuthConfig() {
  const supabaseUrl = cleanText(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
  const anonKey = cleanText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const ownerEmail = normalizeEmail(process.env.CHAOTICA_OWNER_EMAIL);
  return { supabaseUrl, anonKey, ownerEmail, configured: Boolean(supabaseUrl && anonKey && ownerEmail) };
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getSupabaseFailure(payload, fallback) {
  return {
    error: payload?.error || fallback,
    error_code: payload?.error_code || payload?.code || null,
    error_description: payload?.error_description || payload?.msg || payload?.message || null,
    message: payload?.message || payload?.msg || null,
  };
}

function ownerEmailMatches(email, ownerEmail) {
  return normalizeEmail(email) === ownerEmail;
}

export async function clearChaoticaAuthCookies() {
  const cookieStore = await cookies();
  [
    CHAOTICA_ACCESS_COOKIE,
    CHAOTICA_REFRESH_COOKIE,
    LEGACY_CHAOTICA_ACCESS_COOKIE,
    LEGACY_CHAOTICA_REFRESH_COOKIE,
  ].forEach((name) => cookieStore.delete(name));
  await clearChaoticaPasswordGateCookie();
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
  const payload = response.ok ? await parseJson(response) : await parseJson(response);
  const email = normalizeEmail(payload?.email);
  const ownerMatches = response.ok && ownerEmailMatches(email, config.ownerEmail);

  return {
    ok: Boolean(response.ok && ownerMatches),
    configured: true,
    status: response.ok && !ownerMatches ? 403 : response.status,
    error: response.ok ? (ownerMatches ? null : 'owner_authorization_only') : 'invalid_supabase_session_access_token',
    error_description: response.ok ? null : payload?.msg || payload?.message || payload?.error_description || null,
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

export async function sendChaoticaEmailOtp(email) {
  const config = getSupabaseAuthConfig();
  await clearChaoticaAuthCookies();
  if (!config.configured) return { ok: false, configured: false, status: 503, error: 'supabase_auth_not_configured' };
  if (!ownerEmailMatches(email, config.ownerEmail)) {
    return { ok: false, configured: true, status: 403, error: 'owner_authorization_only', message: 'Owner authorization only.' };
  }

  const response = await fetch(`${config.supabaseUrl}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: normalizeEmail(email), create_user: false }),
    cache: 'no-store',
  });
  const payload = await parseJson(response);
  if (!response.ok) return { ok: false, configured: true, status: response.status, ...getSupabaseFailure(payload, 'email_otp_send_failed') };
  return { ok: true, configured: true };
}

export async function verifyChaoticaEmailOtp(email, token) {
  const config = getSupabaseAuthConfig();
  await clearChaoticaAuthCookies();
  if (!config.configured) return { ok: false, configured: false, status: 503, error: 'supabase_auth_not_configured' };
  if (!ownerEmailMatches(email, config.ownerEmail)) {
    return { ok: false, configured: true, status: 403, error: 'owner_authorization_only', message: 'Owner authorization only.' };
  }

  const response = await fetch(`${config.supabaseUrl}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: normalizeEmail(email), token: cleanText(token), type: 'email' }),
    cache: 'no-store',
  });
  const payload = await parseJson(response);
  if (!response.ok || !payload?.access_token) {
    return { ok: false, configured: true, status: response.status, ...getSupabaseFailure(payload, 'email_otp_verify_failed') };
  }

  const verified = await verifySupabaseAccessToken(payload.access_token);
  if (!verified.ok) {
    return {
      ok: false,
      configured: true,
      status: verified.status || 401,
      error: verified.error || 'verified_session_check_failed',
      error_description: verified.error_description || null,
    };
  }

  await setSessionCookies(payload);
  return { ok: true, configured: true };
}

export async function getChaoticaSession() {
  const passwordSession = await getChaoticaPasswordSession();
  if (passwordSession.configured) return passwordSession;

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
