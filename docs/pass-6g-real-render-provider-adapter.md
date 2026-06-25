# Pass 6G — Real Day Capsule Render Provider Adapter

The Day Capsule render path now supports the production storage target selected for TRUTHINSTYLE / CHAOTICA:

1. **Internal OpenAI provider adapter with Supabase Storage** when `DAY_CAPSULE_RENDER_PROVIDER=openai`, `DAY_CAPSULE_RENDER_API_KEY`, `DAY_CAPSULE_RENDER_STORAGE_MODE=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `DAY_CAPSULE_SUPABASE_BUCKET` are configured server-side.
2. **External endpoint proxy** when `DAY_CAPSULE_RENDER_ENDPOINT` is configured and the internal adapter is not configured.
3. **Safe not-configured response** (`external_renderer_not_configured`) when neither backend path is configured.

The app UI posts the Day Capsule render request only. Browser requests must not include provider API keys, Supabase service role keys, proxy tokens, bearer credentials, or `x-day-capsule-render-token` headers.

## Production environment

Production Day Capsule renders must use Supabase Storage:

- `DAY_CAPSULE_RENDER_PROVIDER=openai`
- `DAY_CAPSULE_RENDER_API_KEY=<server-side OpenAI key>` — backend only; never expose to frontend code.
- `DAY_CAPSULE_RENDER_MODEL=gpt-image-1`
- `DAY_CAPSULE_RENDER_SIZE=1024x1536`
- `DAY_CAPSULE_RENDER_STORAGE_MODE=supabase`
- `NEXT_PUBLIC_SUPABASE_URL=<Supabase project URL>`
- `SUPABASE_SERVICE_ROLE_KEY=<server-side Supabase service role key>` — backend only; never use a `NEXT_PUBLIC_` prefix.
- `DAY_CAPSULE_SUPABASE_BUCKET=day-capsules`

The preferred bucket setup for current Day Capsule previews is a public Supabase Storage bucket named `day-capsules`. Public buckets return a browser-displayable public object URL. Private buckets are also supported: the backend creates a signed preview URL with `DAY_CAPSULE_SUPABASE_SIGNED_URL_TTL_SECONDS` or a 7-day default expiration. Signed URLs can expire and may need regeneration before later sealing/display flows.

## Storage behavior

OpenAI image output is expected as base64 image data. In Supabase mode the backend:

1. Converts the provider base64 image to a Node `Buffer`.
2. Uploads the image to Supabase Storage with `x-upsert: false` so prior renders are not overwritten.
3. Stores objects under `{sourceDate}/{renderId}.png` (or the matching image extension) inside the configured bucket.
4. Returns `artifactUrl`, `artifactPath`, `artifactType`, `renderId`, `payloadId`, `dayIdentity`, `providerMetadata`, `createdAt`, and `storageMode: "supabase"` in the normalized render record.

Provider success is normalized to `external_rendered` only when a real artifact URL exists. For Supabase mode that means upload must succeed and the backend must receive a public or signed Supabase URL. If upload fails, the adapter returns `external_render_failed` and does not invent or fake an artifact URL.

## Development-only local storage

`DAY_CAPSULE_RENDER_STORAGE_MODE=local` remains development-only. It may write provider base64 output to `DAY_CAPSULE_RENDER_STORAGE_PATH` outside production, but local filesystem storage, `public/day-capsules`, local proof rendering, and local proof artifacts do **not** satisfy final production completion.

Final production Day Capsule completion requires `external_rendered` with a real Supabase artifact URL. `local_proof_rendered` cannot be sealed as final.
