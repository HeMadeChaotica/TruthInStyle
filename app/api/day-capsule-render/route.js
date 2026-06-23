import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

const STATUS = Object.freeze({
  NOT_CONFIGURED: 'external_renderer_not_configured',
  READY: 'external_renderer_ready',
  RENDERED: 'external_rendered',
  FAILED: 'external_render_failed',
});

function safeTokenMatch(received, expected) {
  const cleanReceived = cleanText(received);
  const cleanExpected = cleanText(expected);
  if (!cleanReceived || !cleanExpected) return false;

  const receivedBuffer = Buffer.from(cleanReceived);
  const expectedBuffer = Buffer.from(cleanExpected);
  if (receivedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

function readProxyToken(request) {
  const authorization = cleanText(request.headers.get('authorization'));
  if (authorization?.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }
  return request.headers.get('x-day-capsule-render-token');
}

function unauthorizedResponse(renderRequest, message = 'Day Capsule render proxy authorization is required.') {
  return NextResponse.json({
    renderId: renderRequest?.renderId || null,
    payloadId: renderRequest?.payloadId || null,
    status: STATUS.FAILED,
    message,
    error: message,
    renderArtifact: null,
    renderRequest,
    createdAt: renderRequest?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { status: 401 });
}

function cleanText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function missingConfigResponse(renderRequest) {
  const now = new Date().toISOString();
  return NextResponse.json({
    renderId: renderRequest?.renderId || null,
    payloadId: renderRequest?.payloadId || null,
    status: STATUS.NOT_CONFIGURED,
    message: 'External renderer is not configured yet.',
    renderRequest,
    renderArtifact: null,
    error: null,
    createdAt: renderRequest?.createdAt || now,
    updatedAt: now,
  }, { status: 200 });
}

function normalizeProviderResult(providerResult, renderRequest) {
  const now = new Date().toISOString();
  const artifactUrl = cleanText(providerResult?.artifactUrl || providerResult?.url || providerResult?.imageUrl || providerResult?.output?.url);
  const artifactPath = cleanText(providerResult?.artifactPath || providerResult?.path || providerResult?.output?.path);
  const artifactBlob = providerResult?.artifactBlob || providerResult?.blob || null;
  const previewPath = cleanText(providerResult?.previewPath || providerResult?.preview?.path);
  const thumbnailUrl = cleanText(providerResult?.thumbnailUrl || providerResult?.thumbnail?.url);
  const hasArtifact = Boolean(artifactUrl || artifactPath || artifactBlob || previewPath);

  if (!hasArtifact) {
    return {
      renderId: renderRequest.renderId,
      payloadId: renderRequest.payloadId,
      status: STATUS.FAILED,
      message: 'External renderer did not return an artifact.',
      error: 'External renderer did not return artifactUrl, artifactPath, artifactBlob, or previewPath.',
      renderRequest,
      renderArtifact: null,
      providerMetadata: providerResult?.providerMetadata || providerResult?.metadata || {},
      createdAt: renderRequest.createdAt || now,
      updatedAt: now,
    };
  }

  return {
    renderId: cleanText(providerResult?.renderId) || renderRequest.renderId,
    payloadId: cleanText(providerResult?.payloadId) || renderRequest.payloadId,
    status: STATUS.RENDERED,
    artifactType: cleanText(providerResult?.artifactType || providerResult?.type) || 'image',
    artifactUrl,
    artifactPath,
    artifactBlob,
    thumbnailUrl,
    previewPath,
    providerMetadata: providerResult?.providerMetadata || providerResult?.metadata || {},
    renderRequest,
    renderArtifact: {
      artifactType: cleanText(providerResult?.artifactType || providerResult?.type) || 'image',
      artifactUrl,
      url: artifactUrl || artifactPath || previewPath,
      artifactPath,
      artifactBlob,
      thumbnailUrl,
      previewPath,
      providerMetadata: providerResult?.providerMetadata || providerResult?.metadata || {},
    },
    createdAt: renderRequest.createdAt || now,
    updatedAt: now,
  };
}

export async function GET() {
  const configured = Boolean(cleanText(process.env.DAY_CAPSULE_RENDER_ENDPOINT));
  return NextResponse.json({
    status: configured ? STATUS.READY : STATUS.NOT_CONFIGURED,
    message: configured ? 'External renderer is configured.' : 'External renderer is not configured yet.',
  });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ status: STATUS.FAILED, message: 'Invalid render request JSON.', error: error.message }, { status: 400 });
  }

  const renderRequest = body?.renderRequest || body;
  if (!renderRequest?.renderId || !renderRequest?.payloadId || !renderRequest?.dayIdentity || !renderRequest?.sourceSnapshot) {
    return NextResponse.json({
      status: STATUS.FAILED,
      message: 'Invalid Day Capsule render request.',
      error: 'renderId, payloadId, dayIdentity, and sourceSnapshot are required.',
      renderArtifact: null,
      renderRequest,
    }, { status: 400 });
  }

  const endpoint = cleanText(process.env.DAY_CAPSULE_RENDER_ENDPOINT);
  if (!endpoint) return missingConfigResponse(renderRequest);

  const proxyToken = cleanText(process.env.DAY_CAPSULE_RENDER_PROXY_TOKEN);
  if (proxyToken && !safeTokenMatch(readProxyToken(request), proxyToken)) {
    return unauthorizedResponse(renderRequest);
  }

  const headers = { 'Content-Type': 'application/json' };
  const apiKey = cleanText(process.env.DAY_CAPSULE_RENDER_API_KEY);
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const providerResponse = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ renderRequest }),
    });
    const providerResult = await providerResponse.json().catch(() => ({}));
    if (!providerResponse.ok) {
      return NextResponse.json({
        renderId: renderRequest.renderId,
        payloadId: renderRequest.payloadId,
        status: STATUS.FAILED,
        message: 'External Day Capsule render failed.',
        error: cleanText(providerResult?.error || providerResult?.message) || `Renderer returned HTTP ${providerResponse.status}.`,
        renderRequest,
        renderArtifact: null,
        providerMetadata: providerResult?.providerMetadata || providerResult?.metadata || {},
        createdAt: renderRequest.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { status: 200 });
    }
    return NextResponse.json(normalizeProviderResult(providerResult, renderRequest));
  } catch (error) {
    return NextResponse.json({
      renderId: renderRequest.renderId,
      payloadId: renderRequest.payloadId,
      status: STATUS.FAILED,
      message: 'External Day Capsule render failed.',
      error: error.message,
      renderRequest,
      renderArtifact: null,
      createdAt: renderRequest.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { status: 200 });
  }
}
