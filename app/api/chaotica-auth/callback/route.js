import { NextResponse } from 'next/server';
import { exchangeOAuthCodeForSession, persistOAuthSession } from '../../../../src/server/chaoticaSupabaseAuth';
import { sanitizeAuthNext } from '../../../../src/shared/authNext';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const result = body?.code
    ? await exchangeOAuthCodeForSession(String(body.code), body?.redirectTo)
    : await persistOAuthSession(body?.session);

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
