import { NextResponse } from 'next/server';
import { getChaoticaSession } from '../../../../src/server/chaoticaSupabaseAuth';

export async function GET() {
  const session = await getChaoticaSession();
  return NextResponse.json({ authorized: Boolean(session.ok), configured: session.configured !== false });
}
