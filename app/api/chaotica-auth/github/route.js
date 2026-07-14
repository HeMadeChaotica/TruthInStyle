import { NextResponse } from 'next/server';
import { getGithubOAuthUrl } from '../../../../src/server/chaoticaSupabaseAuth';
import { sanitizeAuthNext } from '../../../../src/shared/authNext';

export async function GET(request) {
  const next = sanitizeAuthNext(request.nextUrl.searchParams.get('next'));
  const redirectTo = `${request.nextUrl.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const url = getGithubOAuthUrl(redirectTo);
  if (!url) {
    return NextResponse.json({ error: 'supabase_auth_not_configured' }, { status: 503 });
  }
  return NextResponse.json({ url });
}
