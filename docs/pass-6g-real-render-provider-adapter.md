# Pass 6G — Real Day Capsule Render Provider Adapter

`POST /api/day-capsule-render` now supports two backend-only renderer paths, in priority order:

1. **Internal provider adapter** when `DAY_CAPSULE_RENDER_PROVIDER=openai`, `DAY_CAPSULE_RENDER_API_KEY`, and durable local artifact storage are configured server-side.
2. **External endpoint proxy** when `DAY_CAPSULE_RENDER_ENDPOINT` is configured and the internal adapter is not configured.
3. **Safe not-configured response** (`external_renderer_not_configured`) when neither backend path is configured.

## Backend-only environment variables

Do not prefix secrets with frontend-public prefixes. Do not commit secret values.

- `DAY_CAPSULE_RENDER_PROVIDER` — currently supports `openai` for the internal backend adapter.
- `DAY_CAPSULE_RENDER_API_KEY` — provider key, read only inside backend route/provider code.
- `DAY_CAPSULE_RENDER_MODEL` — provider model; defaults to `gpt-image-1` if unset.
- `DAY_CAPSULE_RENDER_SIZE` — optional OpenAI image size; defaults to `1024x1536`.
- `DAY_CAPSULE_RENDER_STORAGE_MODE` — set to `local` when using the internal OpenAI adapter so returned base64 artifacts can be stored to disk.
- `DAY_CAPSULE_RENDER_STORAGE_PATH` — required for internal OpenAI readiness and local base64 storage, preferably under `public/` when browser preview is needed.
- `DAY_CAPSULE_RENDER_ENDPOINT` — optional external renderer endpoint fallback/proxy path.
- `DAY_CAPSULE_RENDER_PROXY_TOKEN` — optional bearer/header guard for render requests; when set, it is enforced before both internal provider renders and external endpoint proxy calls.

## Artifact rules

Provider success is normalized to `external_rendered` only when a real artifact reference exists: `artifactUrl`, `artifactPath`, or `artifactBlob`. OpenAI image output is base64, so the internal OpenAI adapter is considered ready only when durable local storage is explicitly configured and can turn that base64 into an artifact path. If base64 is returned without durable storage, the adapter returns `external_render_failed` with `missing_storage_path`.

Local proof rendering remains development-only and does not satisfy final Level 2 completion or Hopewood sealing gates.
