import { NextResponse } from 'next/server';

const CHAOTICA_ACCESS_COOKIE = 'chaotica-supabase-session-access';
const CHAOTICA_REFRESH_COOKIE = 'chaotica-supabase-session-refresh';
const LEGACY_CHAOTICA_ACCESS_COOKIE = 'chaotica-supabase-access';
const LEGACY_CHAOTICA_REFRESH_COOKIE = 'chaotica-supabase-refresh';
const CHAOTICA_PASSWORD_SESSION_COOKIE = 'chaotica-password-gate-session';

const PROTECTED_PATHS = [
  '/525600',
  '/clock-it',
  '/da-eater',
  '/hopewood',
  '/its-getting-thicc',
  '/remember-me',
  '/summate',
  '/the-assurer',
  '/the-summation',
  '/the-work',
  '/thicc-fitt',
];

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

function canonicalizePassword(value) {
  // Match the server-side password gate: no accidental dashboard-paste
  // whitespace, while retaining case sensitivity and internal characters.
  return String(value || '').normalize('NFC').trim();
}

function encodeBase64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function passwordSessionIsValid(request) {
  const password = canonicalizePassword(process.env.CHAOTICA_GATE_PASSWORD);
  if (!password) return false;

  const raw = request.cookies.get(CHAOTICA_PASSWORD_SESSION_COOKIE)?.value || '';
  const [expiresAtText, receivedSignature] = raw.split('.', 2);
  const expiresAt = Number(expiresAtText);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000) || !receivedSignature) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBytes = new Uint8Array(await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`CHAOTICA_PASSWORD_GATE:${expiresAt}`),
  ));
  const expectedSignature = encodeBase64Url(signatureBytes);
  if (receivedSignature.length !== expectedSignature.length) return false;

  let mismatch = 0;
  for (let index = 0; index < expectedSignature.length; index += 1) {
    mismatch |= expectedSignature.charCodeAt(index) ^ receivedSignature.charCodeAt(index);
  }
  return mismatch === 0;
}

async function verifyAccessToken({ accessToken, supabaseUrl, anonKey, ownerEmail }) {
  if (!accessToken) return false;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) return false;
  const user = await response.json().catch(() => ({}));
  return String(user?.email || '').trim().toLowerCase() === ownerEmail;
}

async function refreshAccessToken({ refreshToken, supabaseUrl, anonKey, ownerEmail }) {
  if (!refreshToken) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const session = await response.json().catch(() => null);
  if (!session?.access_token) return null;
  const ownerVerified = await verifyAccessToken({
    accessToken: session.access_token,
    supabaseUrl,
    anonKey,
    ownerEmail,
  });
  return ownerVerified ? session : null;
}

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (!isProtected) return NextResponse.next();

  const passwordGateConfigured = Boolean(canonicalizePassword(process.env.CHAOTICA_GATE_PASSWORD));
  if (passwordGateConfigured) {
    if (await passwordSessionIsValid(request)) return NextResponse.next();
    const redirect = NextResponse.redirect(new URL('/', request.url));
    redirect.cookies.delete(CHAOTICA_PASSWORD_SESSION_COOKIE);
    return redirect;
  }

  const accessToken = request.cookies.get(CHAOTICA_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(CHAOTICA_REFRESH_COOKIE)?.value;
  if (!accessToken && !refreshToken) return NextResponse.redirect(new URL('/', request.url));

  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const ownerEmail = String(process.env.CHAOTICA_OWNER_EMAIL || '').trim().toLowerCase();
  if (!supabaseUrl || !anonKey || !ownerEmail) return NextResponse.redirect(new URL('/', request.url));

  try {
    const verified = await verifyAccessToken({ accessToken, supabaseUrl, anonKey, ownerEmail });
    if (verified) return NextResponse.next();

    const refreshed = await refreshAccessToken({ refreshToken, supabaseUrl, anonKey, ownerEmail });
    if (refreshed) {
      const response = NextResponse.next();
      response.cookies.set(CHAOTICA_ACCESS_COOKIE, refreshed.access_token, {
        ...SESSION_COOKIE_OPTIONS,
        maxAge: Math.max(60, Number(refreshed.expires_in || 3600)),
      });
      if (refreshed.refresh_token) {
        response.cookies.set(CHAOTICA_REFRESH_COOKIE, refreshed.refresh_token, {
          ...SESSION_COOKIE_OPTIONS,
          maxAge: 60 * 60 * 24 * 30,
        });
      }
      response.cookies.delete(LEGACY_CHAOTICA_ACCESS_COOKIE);
      response.cookies.delete(LEGACY_CHAOTICA_REFRESH_COOKIE);
      return response;
    }
  } catch {
    // Treat auth verification failures as unauthenticated.
  }

  const redirect = NextResponse.redirect(new URL('/', request.url));
  redirect.cookies.delete(CHAOTICA_ACCESS_COOKIE);
  redirect.cookies.delete(CHAOTICA_REFRESH_COOKIE);
  redirect.cookies.delete(LEGACY_CHAOTICA_ACCESS_COOKIE);
  redirect.cookies.delete(LEGACY_CHAOTICA_REFRESH_COOKIE);
  redirect.cookies.delete(CHAOTICA_PASSWORD_SESSION_COOKIE);
  return redirect;
}

export const config = {
  matcher: [
    '/525600/:path*',
    '/clock-it/:path*',
    '/da-eater/:path*',
    '/hopewood/:path*',
    '/its-getting-thicc/:path*',
    '/remember-me/:path*',
    '/summate/:path*',
    '/the-assurer/:path*',
    '/the-summation/:path*',
    '/the-work/:path*',
    '/thicc-fitt/:path*',
  ],
};
