import { NextResponse } from 'next/server';
import { verifyChaoticaEmailOtp } from '../../../../../src/server/chaoticaSupabaseAuth';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const result = await verifyChaoticaEmailOtp(body?.email, body?.token);
  if (!result.ok) {
    return NextResponse.json({
      error: result.error,
      error_code: result.error_code,
      error_description: result.error_description,
      message: result.message,
      configured: result.configured !== false,
    }, { status: result.status || 400 });
  }
  return NextResponse.json({ authorized: true });
}
