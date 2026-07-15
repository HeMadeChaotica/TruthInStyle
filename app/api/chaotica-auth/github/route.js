import { NextResponse } from 'next/server';
import { clearChaoticaAuthCookies } from '../../../../src/server/chaoticaSupabaseAuth';

export async function GET() {
  await clearChaoticaAuthCookies();
  return NextResponse.json({ error: 'github_auth_disabled' }, { status: 410 });
}
