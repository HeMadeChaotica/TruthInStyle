import { NextResponse } from 'next/server';
import {
  clearChaoticaAuthCookies,
  establishSessionFromTokens,
  exchangeOAuthCodeForSession,
} from '../../../../src/server/chaoticaSupabaseAuth';
import { sanitizeAuthNext } from '../../../../src/shared/authNext';

function authFailureResponse(result) {
  return NextResponse.json({
    error: result.error,
    error_code: result.error_code,
    error_description: result.error_description,
    message: result.message,
  }, { status: result.status || 400 });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  if (body?.clearAuth === true) {
    await clearChaoticaAuthCookies();
    return NextResponse.json({ cleared: true });
  }

  const code = typeof body?.code === 'string' ? body.code : '';
  const accessToken = typeof body?.access_token === 'string' ? body.access_token : '';
  const refreshToken = typeof body?.refresh_token === 'string' ? body.refresh_token : '';

  if (code.trim()) {
    const result = await exchangeOAuthCodeForSession(code, body?.redirectTo);
    if (!result.ok) return authFailureResponse(result);
    return NextResponse.json({ authorized: true, next: sanitizeAuthNext(body?.next) });
  }

  if (accessToken.trim()) {
    const result = await establishSessionFromTokens(accessToken, refreshToken);
    if (!result.ok) return authFailureResponse(result);
    return NextResponse.json({ authorized: true, next: sanitizeAuthNext(body?.next) });
  }

  await clearChaoticaAuthCookies();
  return NextResponse.json({ error: 'missing_oauth_code_or_tokens' }, { status: 400 });
}
