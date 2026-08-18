import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const CHAOTICA_PASSWORD_SESSION_COOKIE = 'chaotica-password-gate-session';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

function canonicalizePassword(value) {
  // Dashboard pastes can pick up a trailing newline or space. Keep the password
  // case-sensitive and preserve internal characters while ignoring that noise.
  return String(value || '').normalize('NFC').trim();
}

function configuredPassword() {
  return canonicalizePassword(process.env.CHAOTICA_GATE_PASSWORD);
}

function digest(value) {
  return createHash('sha256').update(value).digest();
}

function matchesPassword(candidate, expected) {
  const candidateDigest = digest(candidate);
  const expectedDigest = digest(expected);
  return timingSafeEqual(candidateDigest, expectedDigest);
}

function signature(expiresAt, password) {
  return createHmac('sha256', password)
    .update(`CHAOTICA_PASSWORD_GATE:${expiresAt}`)
    .digest('base64url');
}

export function getChaoticaPasswordGateConfig() {
  return { configured: Boolean(configuredPassword()) };
}

export async function clearChaoticaPasswordGateCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CHAOTICA_PASSWORD_SESSION_COOKIE);
}

export async function verifyChaoticaPassword(password) {
  const expected = configuredPassword();
  if (!expected) {
    return {
      ok: false,
      configured: false,
      status: 503,
      error: 'chaotica_password_not_configured',
      message: 'CHAOTICA password access has not been configured yet.',
    };
  }

  const candidate = canonicalizePassword(password);
  if (!matchesPassword(candidate, expected)) {
    return {
      ok: false,
      configured: true,
      status: 401,
      error: 'invalid_chaotica_password',
      message: 'That password does not open the seal.',
    };
  }

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const cookieStore = await cookies();
  cookieStore.set(
    CHAOTICA_PASSWORD_SESSION_COOKIE,
    `${expiresAt}.${signature(expiresAt, expected)}`,
    { ...COOKIE_OPTIONS, maxAge: SESSION_TTL_SECONDS },
  );
  return { ok: true, configured: true };
}

export async function getChaoticaPasswordSession() {
  const expected = configuredPassword();
  if (!expected) return { ok: false, configured: false, error: 'chaotica_password_not_configured' };

  const cookieStore = await cookies();
  const raw = cookieStore.get(CHAOTICA_PASSWORD_SESSION_COOKIE)?.value || '';
  const [expiresAtText, receivedSignature] = raw.split('.', 2);
  const expiresAt = Number(expiresAtText);
  const validExpiry = Number.isFinite(expiresAt) && expiresAt > Math.floor(Date.now() / 1000);
  const expectedSignature = validExpiry ? signature(expiresAt, expected) : '';
  const receivedBuffer = Buffer.from(receivedSignature || '');
  const expectedBuffer = Buffer.from(expectedSignature);
  const validSignature = Boolean(receivedSignature && expectedSignature)
    && receivedBuffer.length === expectedBuffer.length
    && timingSafeEqual(receivedBuffer, expectedBuffer);

  if (!validExpiry || !validSignature) {
    if (raw) await clearChaoticaPasswordGateCookie();
    return { ok: false, configured: true, error: 'missing_chaotica_password_session' };
  }

  return { ok: true, configured: true, authorization: 'password' };
}
