import { NextResponse } from 'next/server';
import { signInChaoticaOwner } from '../../../../src/server/chaoticaSupabaseAuth';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const password = String(body?.password || '');
  if (!password) {
    return NextResponse.json({ authorized: false, error: 'missing_supabase_credential' }, { status: 400 });
  }

  const result = await signInChaoticaOwner(password);
  if (!result.ok) {
    return NextResponse.json({ authorized: false, error: result.error }, { status: result.status || 401 });
  }

  return NextResponse.json({ authorized: true });
}
