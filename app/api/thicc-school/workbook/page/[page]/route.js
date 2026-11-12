import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getChaoticaSession } from '../../../../../../src/server/chaoticaSupabaseAuth';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const session = await getChaoticaSession();
  if (!session.ok) return NextResponse.json({ error: 'A verified Supabase gate session is required.' }, { status: 401 });
  const values = await params;
  const pageNumber = Number(values?.page);
  if (!Number.isInteger(pageNumber) || pageNumber < 3 || pageNumber > 104) {
    return NextResponse.json({ error: 'WORKBOOK PAGE NOT FOUND' }, { status: 404 });
  }
  try {
    const file = path.join(process.cwd(), 'private', 'issa', 'cpt11-workbook', 'pages', `${String(pageNumber).padStart(3, '0')}.jpg`);
    const bytes = await readFile(file);
    return new Response(bytes, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600' } });
  } catch {
    return NextResponse.json({ error: 'WORKBOOK PAGE NOT FOUND' }, { status: 404 });
  }
}
