import { NextResponse } from 'next/server';
import {
  getDayCapsuleRenderConfigDiagnostic,
  isDayCapsuleProviderConfigured,
  normalizeProviderArtifact,
  renderDayCapsuleWithProvider,
} from '../../../src/server/dayCapsuleRenderProvider';
import { getChaoticaSession } from '../../../src/server/chaoticaSupabaseAuth';

const STATUS = Object.freeze({
  NOT_CONFIGURED: 'external_renderer_not_configured',
  READY: 'external_renderer_ready',
  RENDERED: 'external_rendered',
  FAILED: 'external_render_failed',
});

function cleanText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}


function unauthorizedResponse(renderRequest, message = 'Unauthorized Day Capsule render request.', error = 'A verified Supabase gate session is required.') {
  const now = new Date().toISOString();
  return NextResponse.json({
    renderId: renderRequest?.renderId || null,
    payloadId: renderRequest?.payloadId || null,
    status: STATUS.FAILED,
    message,
    error,
    renderRequest,
    renderArtifact: null,
    createdAt: renderRequest?.createdAt || now,
    updatedAt: now,
  }, { status: 401 });
}

function missingConfigResponse(renderRequest) {
  const now = new Date().toISOString();
  const configDiagnostic = getDayCapsuleRenderConfigDiagnostic();
  return NextResponse.json({
    renderId: renderRequest?.renderId || null,
    payloadId: renderRequest?.payloadId || null,
    status: STATUS.NOT_CONFIGURED,
    message: 'External renderer is not configured yet. Missing renderer configuration is listed in configDiagnostic.missingEnv.',
    configDiagnostic,
    configured: false,
    missingConfig: configDiagnostic.missingEnv,
    providerReason: 'External renderer is not configured.',
    retryable: false,
    renderRequest,
    renderArtifact: null,
    error: `Missing required config: ${configDiagnostic.missingEnv.join(', ') || 'renderer provider or external endpoint'}.`,
    createdAt: renderRequest?.createdAt || now,
    updatedAt: now,
  }, { status: 200 });
}

async function proxyToExternalEndpoint(endpoint, renderRequest) {
  const headers = { 'Content-Type': 'application/json' };
  const proxyToken = cleanText(process.env.DAY_CAPSULE_RENDER_PROXY_TOKEN);
  if (proxyToken) {
    headers.Authorization = `Bearer ${proxyToken}`;
    headers['x-day-capsule-render-token'] = proxyToken;
  }

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
      providerStatus: providerResponse.status,
      providerReason: cleanText(providerResult?.providerReason || providerResult?.error || providerResult?.message) || `Renderer returned HTTP ${providerResponse.status}.`,
      retryable: [408, 409, 425, 429, 500, 502, 503, 504].includes(providerResponse.status),
      createdAt: renderRequest.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  return normalizeProviderArtifact(providerResult, renderRequest);
}

export async function GET() {
  const session = await getChaoticaSession();
  if (!session.ok) return unauthorizedResponse(null);

  const internalProviderConfigured = isDayCapsuleProviderConfigured();
  const endpointConfigured = Boolean(cleanText(process.env.DAY_CAPSULE_RENDER_ENDPOINT));
  const configured = internalProviderConfigured || endpointConfigured;
  const configDiagnostic = getDayCapsuleRenderConfigDiagnostic();
  return NextResponse.json({
    status: configured ? STATUS.READY : STATUS.NOT_CONFIGURED,
    message: configured ? 'External renderer is configured.' : 'External renderer is not configured yet. Missing renderer configuration is listed in configDiagnostic.missingEnv.',
    providerMode: internalProviderConfigured ? 'internal_provider_adapter' : (endpointConfigured ? 'external_endpoint_proxy' : null),
    configDiagnostic,
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

  const session = await getChaoticaSession();
  if (!session.ok) return unauthorizedResponse(renderRequest);

  const internalProviderConfigured = isDayCapsuleProviderConfigured();
  const endpoint = cleanText(process.env.DAY_CAPSULE_RENDER_ENDPOINT);
  if (!internalProviderConfigured && !endpoint) return missingConfigResponse(renderRequest);

  // DAY_CAPSULE_RENDER_PROXY_TOKEN is server-only and is attached only when proxying
  // to an external renderer. Browser callers authenticate with the verified gate session.
  try {
    const result = internalProviderConfigured
      ? await renderDayCapsuleWithProvider(renderRequest)
      : await proxyToExternalEndpoint(endpoint, renderRequest);
    console.info('day-capsule-render-result', {
      renderId: renderRequest.renderId,
      payloadId: renderRequest.payloadId,
      status: result?.status || null,
      providerStatus: result?.providerStatus || null,
      providerCode: result?.providerCode || null,
      retryable: result?.retryable ?? null,
    });
    return NextResponse.json({ ...result, renderRequest: result?.renderRequest || renderRequest });
  } catch (error) {
    return NextResponse.json({
      renderId: renderRequest.renderId,
      payloadId: renderRequest.payloadId,
      status: STATUS.FAILED,
      message: 'External Day Capsule render failed.',
      error: error.message,
      providerReason: error.message,
      configured: true,
      retryable: true,
      renderRequest,
      renderArtifact: null,
      createdAt: renderRequest.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { status: 200 });
  }
}
