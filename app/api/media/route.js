import { NextResponse } from 'next/server';
import { getChaoticaSession } from '../../../src/server/chaoticaSupabaseAuth';
import { readPrivateMedia, uploadPrivateMedia } from '../../../src/server/privateMediaStorage';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_BYTES = 10 * 1024 * 1024;

function unauthorized() {
  return NextResponse.json({ error: 'A verified Supabase gate session is required.' }, { status: 401 });
}

export async function GET(request) {
  const session = await getChaoticaSession();
  if (!session.ok) return unauthorized();
  try {
    const media = await readPrivateMedia(new URL(request.url).searchParams.get('path'));
    return new Response(media.bytes, { headers: { 'Content-Type': media.contentType, 'Cache-Control': 'private, max-age=3600' } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function POST(request) {
  const session = await getChaoticaSession();
  if (!session.ok) return unauthorized();
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') return NextResponse.json({ error: 'An image file is required.' }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'PNG, JPEG, WEBP, or GIF images only.' }, { status: 415 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Image must be 10 MB or smaller.' }, { status: 413 });
    const result = await uploadPrivateMedia(Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      context: form.get('context'),
      sourceDate: form.get('sourceDate'),
      originalName: file.name,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
}
