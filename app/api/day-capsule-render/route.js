import { NextResponse } from 'next/server';

import { buildProviderPrompt } from '../../../src/server/dayCapsuleRenderProvider';
import { getChaoticaSession } from '../../../src/server/chaoticaSupabaseAuth';

const STATUS = Object.freeze({
  HANDOFF_READY: 'chatgpt_handoff_ready',
  FAILED: 'chatgpt_handoff_failed',
});

function unauthorizedResponse(renderRequest) {
  const now = new Date().toISOString();
  return NextResponse.json({
    renderId: renderRequest?.renderId || null,
    payloadId: renderRequest?.payloadId || null,
    status: STATUS.FAILED,
    message: 'A verified Chaotica gate session is required.',
    error: 'Unauthorized Day Capsule handoff request.',
    renderRequest,
    renderArtifact: null,
    createdAt: renderRequest?.createdAt || now,
    updatedAt: now,
  }, { status: 401 });
}

export async function GET() {
  const session = await getChaoticaSession();
  if (!session.ok) return unauthorizedResponse(null);

  return NextResponse.json({
    status: STATUS.HANDOFF_READY,
    message: 'ChatGPT Day Capsule handoff is ready.',
    providerMode: 'chatgpt_handoff_with_authenticated_return',
  });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({
      status: STATUS.FAILED,
      message: 'Invalid render request JSON.',
      error: error.message,
    }, { status: 400 });
  }

  const renderRequest = body?.renderRequest || body;
  if (!renderRequest?.renderId || !renderRequest?.payloadId || !renderRequest?.dayIdentity || !renderRequest?.sourceSnapshot) {
    return NextResponse.json({
      status: STATUS.FAILED,
      message: 'Invalid Day Capsule handoff request.',
      error: 'renderId, payloadId, dayIdentity, and sourceSnapshot are required.',
      renderArtifact: null,
      renderRequest,
    }, { status: 400 });
  }

  const session = await getChaoticaSession();
  if (!session.ok) return unauthorizedResponse(renderRequest);

  const now = new Date().toISOString();
  const providerPrompt = buildProviderPrompt(renderRequest);
  console.info('day-capsule-chatgpt-handoff-ready', {
    renderId: renderRequest.renderId,
    payloadId: renderRequest.payloadId,
  });

  return NextResponse.json({
    renderId: renderRequest.renderId,
    payloadId: renderRequest.payloadId,
    status: STATUS.HANDOFF_READY,
    message: 'Day Capsule prepared for ChatGPT. Continue in ChatGPT, then return the finished visualization here.',
    providerPrompt,
    providerMetadata: {
      provider: 'chatgpt_handoff',
      returnMode: 'authenticated_manual_upload',
    },
    renderRequest,
    renderArtifact: null,
    configured: true,
    retryable: false,
    createdAt: renderRequest.createdAt || now,
    updatedAt: now,
  });
}
