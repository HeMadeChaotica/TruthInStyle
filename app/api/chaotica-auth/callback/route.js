import { NextResponse } from 'next/server';
import { exchangeOAuthCodeForSession, persistOAuthSession } from '../../../../src/server/chaoticaSupabaseAuth';
import { sanitizeAuthNext } from '../../../../src/shared/authNext';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const result = body?.code
    ? await exchangeOAuthCodeForSession(String(body.code))
    : await persistOAuthSession(body?.session);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status || 400 });
  }

  return NextResponse.json({ authorized: true, next: sanitizeAuthNext(body?.next) });
}
