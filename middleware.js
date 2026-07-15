import { NextResponse } from 'next/server';
import {
  CHAOTICA_ACCESS_COOKIE,
  CHAOTICA_REFRESH_COOKIE,
  LEGACY_CHAOTICA_ACCESS_COOKIE,
  LEGACY_CHAOTICA_REFRESH_COOKIE,
} from './src/server/chaoticaSupabaseAuth';

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

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (!isProtected) return NextResponse.next();

  const accessToken = request.cookies.get(CHAOTICA_ACCESS_COOKIE)?.value;
  if (!accessToken) return NextResponse.redirect(new URL('/', request.url));

  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const ownerEmail = String(process.env.CHAOTICA_OWNER_EMAIL || '').trim().toLowerCase();
  if (!supabaseUrl || !anonKey || !ownerEmail) return NextResponse.redirect(new URL('/', request.url));

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });
    if (response.ok) {
      const user = await response.json().catch(() => ({}));
      if (String(user?.email || '').trim().toLowerCase() === ownerEmail) return NextResponse.next();
    }
  } catch {
    // Treat auth verification failures as unauthenticated.
  }

  const redirect = NextResponse.redirect(new URL('/', request.url));
  redirect.cookies.delete(CHAOTICA_ACCESS_COOKIE);
  redirect.cookies.delete(CHAOTICA_REFRESH_COOKIE);
  redirect.cookies.delete(LEGACY_CHAOTICA_ACCESS_COOKIE);
  redirect.cookies.delete(LEGACY_CHAOTICA_REFRESH_COOKIE);
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
