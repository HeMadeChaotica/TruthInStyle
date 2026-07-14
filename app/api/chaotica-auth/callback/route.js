import { NextResponse } from 'next/server';
import { clearChaoticaAuthCookies, exchangeOAuthCodeForSession } from '../../../../src/server/chaoticaSupabaseAuth';
import { sanitizeAuthNext } from '../../../../src/shared/authNext';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const code = typeof body?.code === 'string' ? body.code : '';

  if (!code.trim()) {
    await clearChaoticaAuthCookies();
    return NextResponse.json({ error: 'missing_oauth_code' }, { status: 400 });
  }

  const result = await exchangeOAuthCodeForSession(code, body?.redirectTo);

  if (!result.ok) {
    return NextResponse.json({
      error: result.error,
      error_code: result.error_code,
      error_description: result.error_description,
      message: result.message,
    }, { status: result.status || 400 });
  }

  return NextResponse.json({ authorized: true, next: sanitizeAuthNext(body?.next) });
}
