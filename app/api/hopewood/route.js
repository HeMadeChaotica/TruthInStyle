import { NextResponse } from 'next/server';
import { getChaoticaSession } from '../../../src/server/chaoticaSupabaseAuth';
import { readHopewoodArchiveFromSupabase, upsertHopewoodArchiveRecord } from '../../../src/server/hopewoodSupabaseArchive';

function unauthorized() {
  return NextResponse.json({ error: 'A verified Supabase gate session is required.' }, { status: 401 });
}

export async function GET() {
  const session = await getChaoticaSession();
  if (!session.ok) return unauthorized();
  try {
    return NextResponse.json({ records: await readHopewoodArchiveFromSupabase() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
}

export async function POST(request) {
  const session = await getChaoticaSession();
  if (!session.ok) return unauthorized();
  let record;
  try {
    record = (await request.json())?.record;
  } catch {
    return NextResponse.json({ error: 'Invalid HOPEWOOD archive JSON.' }, { status: 400 });
  }
  try {
    return NextResponse.json({ record: await upsertHopewoodArchiveRecord(record) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
}
