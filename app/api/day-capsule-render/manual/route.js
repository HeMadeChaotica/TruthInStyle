import { NextResponse } from 'next/server';

import { getChaoticaSession } from '../../../../src/server/chaoticaSupabaseAuth';
import { uploadDayCapsuleArtifactToSupabase } from '../../../../src/server/dayCapsuleSupabaseStorage';

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function failure(message, status = 400) {
  return NextResponse.json({
    status: 'external_render_failed',
    message,
    renderArtifact: null,
  }, { status });
}

export async function POST(request) {
  const session = await getChaoticaSession();
  if (!session.ok) return failure('A verified Chaotica gate session is required.', 401);

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return failure('The selected visualization could not be read.');
  }

  const image = formData.get('image');
  const renderRequestRaw = formData.get('renderRequest');
  if (!(image instanceof File)) return failure('Choose a PNG, JPEG, or WebP visualization.');
  if (!ALLOWED_IMAGE_TYPES.has(image.type)) return failure('The visualization must be a PNG, JPEG, or WebP image.');
  if (!image.size || image.size > MAX_UPLOAD_BYTES) return failure('The visualization must be smaller than 4 MB.');

  let renderRequest;
  try {
    renderRequest = JSON.parse(String(renderRequestRaw || ''));
  } catch {
    return failure('The Day Capsule details for this visualization are missing.');
  }
  if (!renderRequest?.renderId || !renderRequest?.payloadId || !renderRequest?.dayIdentity?.sourceDate) {
    return failure('The active Day Capsule is missing its render identity.');
  }

  try {
    const manualRenderRequest = {
      ...renderRequest,
      renderId: `${renderRequest.renderId}-manual-${Date.now()}`,
    };
    const buffer = Buffer.from(await image.arrayBuffer());
    const stored = await uploadDayCapsuleArtifactToSupabase(
      buffer.toString('base64'),
      manualRenderRequest,
      image.type,
    );
    const now = new Date().toISOString();
    return NextResponse.json({
      status: 'external_rendered',
      renderId: manualRenderRequest.renderId,
      payloadId: manualRenderRequest.payloadId,
      renderRequest: manualRenderRequest,
      artifactUrl: stored.artifactUrl,
      artifactPath: stored.artifactPath,
      artifactType: stored.artifactType,
      storageMode: stored.storageMode,
      providerMetadata: {
        provider: 'manual_chatgpt_upload',
        storageMode: stored.storageMode,
        bucket: stored.bucket,
        urlType: stored.urlType,
      },
      renderArtifact: {
        artifactUrl: stored.artifactUrl,
        artifactPath: stored.artifactPath,
        artifactType: stored.artifactType,
        url: stored.artifactUrl,
      },
      message: 'Day Visualization uploaded and placed in THE.SUMMATION.',
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    return failure(error?.message || 'The visualization could not be stored.', 500);
  }
}
