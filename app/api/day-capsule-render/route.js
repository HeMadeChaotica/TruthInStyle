import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import {
  isDayCapsuleProviderConfigured,
  normalizeProviderArtifact,
  renderDayCapsuleWithProvider,
} from '../../../src/server/dayCapsuleRenderProvider';

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

function proxyTokenMissingResponse(renderRequest) {
  const now = new Date().toISOString();
  const message = 'Day Capsule render proxy token is not configured.';
  return NextResponse.json({
    renderId: renderRequest?.renderId || null,
    payloadId: renderRequest?.payloadId || null,
    status: STATUS.FAILED,
    message,
    error: 'DAY_CAPSULE_RENDER_PROXY_TOKEN must be configured before forwarding requests to the external renderer.',
    renderArtifact: null,
    renderRequest,
    createdAt: renderRequest?.createdAt || now,
    updatedAt: now,
  }, { status: 503 });
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
    error: 'External Day Capsule render provider and endpoint are not configured.',
    createdAt: renderRequest?.createdAt || now,
    updatedAt: now,
  }, { status: 200 });
}

async function proxyToExternalEndpoint(endpoint, renderRequest) {
  const headers = { 'Content-Type': 'application/json' };
  const apiKey = cleanText(process.env.DAY_CAPSULE_RENDER_API_KEY);
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const providerResponse = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ renderRequest }),
  });
  const providerResult = await providerResponse.json().catch(() => ({}));
  if (!providerResponse.ok) {
    return {
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
    };
  }
  return normalizeProviderArtifact(providerResult, renderRequest);
}

export async function GET() {
  const internalProviderConfigured = isDayCapsuleProviderConfigured();
  const endpointConfigured = Boolean(cleanText(process.env.DAY_CAPSULE_RENDER_ENDPOINT));
  const configured = internalProviderConfigured || endpointConfigured;
  return NextResponse.json({
    status: configured ? STATUS.READY : STATUS.NOT_CONFIGURED,
    message: configured ? 'External renderer is configured.' : 'External renderer is not configured yet.',
    providerMode: internalProviderConfigured ? 'internal_provider_adapter' : (endpointConfigured ? 'external_endpoint_proxy' : null),
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

  const internalProviderConfigured = isDayCapsuleProviderConfigured();
  const endpoint = cleanText(process.env.DAY_CAPSULE_RENDER_ENDPOINT);
  if (!internalProviderConfigured && !endpoint) return missingConfigResponse(renderRequest);

  const proxyToken = cleanText(process.env.DAY_CAPSULE_RENDER_PROXY_TOKEN);
  if (proxyToken && !safeTokenMatch(readProxyToken(request), proxyToken)) {
    return unauthorizedResponse(renderRequest);
  }

  try {
    const result = internalProviderConfigured
      ? await renderDayCapsuleWithProvider(renderRequest)
      : await proxyToExternalEndpoint(endpoint, renderRequest);
    return NextResponse.json({ ...result, renderRequest: result?.renderRequest || renderRequest });
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
