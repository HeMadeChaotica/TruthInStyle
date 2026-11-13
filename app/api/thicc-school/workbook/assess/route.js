import { NextResponse } from 'next/server';
import { getChaoticaSession } from '../../../../../src/server/chaoticaSupabaseAuth';
import { assessWorkbookAnswer } from '../../../../../src/server/cptWorkbookAssessment.mjs';

export const runtime = 'nodejs';

export async function POST(request) {
  const session = await getChaoticaSession();
  if (!session.ok) return NextResponse.json({ error: 'A verified Supabase gate session is required.' }, { status: 401 });
  try {
    const body = await request.json();
    const result = await assessWorkbookAnswer({
      courseId: String(body?.courseId || 'cpt'),
      sectionId: String(body?.sectionId || ''),
      pageNumber: Number(body?.pageNumber),
      fieldId: String(body?.fieldId || ''),
      answer: String(body?.answer || ''),
    });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || 'WORKBOOK ASSESSMENT FAILED', code: error?.code || 'workbook_assessment_failed' },
      { status: Number(error?.status || 500) },
    );
  }
}

