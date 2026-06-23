# Pass 6F — Level 2 renderer unblock and real-payload acceptance path

## Canonical renderer configuration

Use one canonical server-only endpoint name:

- `DAY_CAPSULE_RENDER_ENDPOINT`

Optional server-only variables:

- `DAY_CAPSULE_RENDER_API_KEY` — sent by the backend proxy as `Authorization: Bearer ...` when present.
- `DAY_CAPSULE_RENDER_PROXY_TOKEN` — required when `DAY_CAPSULE_RENDER_ENDPOINT` is configured. Callers must send the matching bearer token or `x-day-capsule-render-token`; the proxy fails closed before forwarding to the external renderer when this token is missing or mismatched.

Do not use `DAY_CAPULE_RENDER_ENDPOINT`; that spelling is intentionally not supported.

## Backend/API proxy status

The Next.js route `POST /api/day-capsule-render` owns the external renderer call. The browser sends a real Day Capsule `renderRequest` to this route, and the route reads `DAY_CAPSULE_RENDER_ENDPOINT` only on the server. Secrets are not exposed to frontend code.

Required status behavior:

- Missing `DAY_CAPSULE_RENDER_ENDPOINT` returns `external_renderer_not_configured`.
- Missing `DAY_CAPSULE_RENDER_PROXY_TOKEN` with a configured endpoint returns `external_render_failed` without invoking the provider.
- A configured endpoint allows the proxy to attempt an external render and returns either `external_rendered` or `external_render_failed`.
- While the frontend request is in flight, the persisted app record uses `external_rendering`.
- Provider results must include an artifact reference (`artifactUrl`, `artifactPath`, `artifactBlob`, or `previewPath`) or they are normalized to `external_render_failed`.

## Real-payload test path

Codex/runtime must not invent Day Capsule content. Use a real app-created payload:

1. Start the app.
2. Use Eye of Truth to choose the active day if needed.
3. Fill Assured Thoughts in THE.ASSURER.
4. Answer two Penny questions if present.
5. Trigger the Crystal Wand from the right-side rail.
6. Confirm a Day Capsule payload exists in app state/localStorage.
7. Navigate to THE.SUMMATION.
8. Start/retry external render and confirm the request is sent to `/api/day-capsule-render`.
9. Confirm the configured external renderer returns an artifact reference.
10. Confirm THE.SUMMATION displays the external artifact while the identity clump remains app-rendered: `titleOfDay`, `MM/DD/YYYY`, full weekday, and Chaotica day number.

If no active real payload exists, THE.SUMMATION must keep the user-facing blocker: “Use the Crystal Wand to prepare a Day Capsule payload first.”

## Artifact storage/reference requirement

A final Level 2 render record must include:

- `status: external_rendered`
- `artifactUrl`, `artifactPath`, or `artifactBlob`/`previewPath`
- `payloadId`
- `renderId`
- `dayIdentity`
- `createdAt`
- `providerMetadata` when the provider returns it

If durable external artifact storage is not configured by the provider endpoint, this remains a blocker and Pass 7/8 must not proceed.

## Seal safety

Hopewood sealing remains blocked unless the persisted render record is externally rendered and includes an artifact reference, matching day identity, and a payload/source snapshot. `local_proof_rendered` remains development-only and cannot satisfy the final seal gate. So Let It Be Done remains only in the right-side control panel.
