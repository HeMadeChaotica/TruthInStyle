import { NextResponse } from 'next/server';
import { getChaoticaSession } from '../../../../src/server/chaoticaSupabaseAuth';

export async function GET() {
  const session = await getChaoticaSession();
  return NextResponse.json({
    authorized: Boolean(session.ok),
    configured: session.configured !== false,
    error: session.ok ? null : session.error || 'session_not_verified',
    error_description: session.error_description || null,
  });
}
