import { NextResponse } from 'next/server';
import { getChaoticaSession } from '../../../src/server/chaoticaSupabaseAuth';
import { mergeOwnerAppState, readOwnerAppState } from '../../../src/server/ownerAppState';

function unauthorized() {
  return NextResponse.json({ error: 'A verified Supabase gate session is required.' }, { status: 401 });
}

export async function GET() {
  const session = await getChaoticaSession();
  if (!session.ok) return unauthorized();
  try {
    return NextResponse.json(await readOwnerAppState());
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
}

export async function POST(request) {
  const session = await getChaoticaSession();
  if (!session.ok) return unauthorized();
  let state;
  try { state = (await request.json())?.state; } catch { return NextResponse.json({ error: 'Invalid cloud state JSON.' }, { status: 400 }); }
  try {
    return NextResponse.json(await mergeOwnerAppState(state));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
}
