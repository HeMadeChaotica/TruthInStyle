import { NextResponse } from 'next/server';
import { getChaoticaPasswordGateConfig, verifyChaoticaPassword } from '../../../../src/server/chaoticaPasswordGate';

export async function GET() {
  return NextResponse.json(getChaoticaPasswordGateConfig());
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const result = await verifyChaoticaPassword(body?.password);
  if (!result.ok) {
    return NextResponse.json({
      authorized: false,
      configured: result.configured,
      error: result.error,
      message: result.message,
    }, { status: result.status || 400 });
  }
  return NextResponse.json({ authorized: true, configured: true });
}
