import { NextResponse } from 'next/server';
import { clearChaoticaAuthCookies } from '../../../../src/server/chaoticaSupabaseAuth';

export async function POST() {
  await clearChaoticaAuthCookies();
  return NextResponse.json({ error: 'oauth_callback_disabled' }, { status: 410 });
}
