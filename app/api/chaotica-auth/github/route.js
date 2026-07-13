import { NextResponse } from 'next/server';
import { getGithubOAuthUrl } from '../../../../src/server/chaoticaSupabaseAuth';

export async function GET(request) {
  const redirectTo = request.nextUrl.searchParams.get('redirectTo') || `${request.nextUrl.origin}/auth/callback?next=/`;
  const url = getGithubOAuthUrl(redirectTo);
  if (!url) {
    return NextResponse.json({ error: 'supabase_auth_not_configured' }, { status: 503 });
  }
  return NextResponse.json({ url });
}
