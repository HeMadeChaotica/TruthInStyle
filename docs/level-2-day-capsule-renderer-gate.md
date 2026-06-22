# Level 2 Day Capsule Renderer Integration Gate

## Repo capability audit

- Backend/API route for private renderer calls: **not present**. This Next app currently has page routes under `app/**/page.js`; no `app/api/**/route.js` renderer boundary exists in the repo.
- Environment variable system for API keys: **partially present for client-exposed Supabase public variables only**. Existing code reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; no private server-only renderer environment variable contract exists.
- Existing image generation service: **not present**. The current Day Capsule renderer only creates a local SVG proof artifact in browser/client code.
- Existing upload/media storage service: **not present**. File inputs use local object URLs or Supabase REST data tables; no durable image upload bucket/service is wired for Day Capsule artifacts.
- Existing artifact/blob/file persistence path: **client-only localStorage present** for payload/render records and Hopewood archive records. No server blob/file persistence path for generated images exists.
- Deployment support for server-side API calls: **framework-capable but not implemented**. Next.js can host server route handlers, but this repository has no renderer API route or private server render service yet.

## Level 2 requirement

Level 2 is not satisfied by `local_proof_rendered`. A complete Level 2 renderer path must run:

Crystal Wand payload → render request → real renderer connection → illustrated Day Capsule artifact → preview in THE.SUMMATION → one revision later → final seal to Hopewood later.

The external renderer must create an illustrated/art-directed page using real day content from the Day Capsule payload. Acceptable art direction includes sketchnote boards, illustrated journal spreads, object-led memory pages, sticky-note memory boards, and editorial daily capsule layouts. The renderer must not fabricate day content.

## Safety gate

If an external renderer is added, all provider calls must run through a backend/server/API boundary. API keys must stay out of frontend bundles, use server-only environment variables, and fail safely when configuration is missing. Until that exists, the local SVG proof remains preview-only and must not be sealed as a production final Day Capsule.

## Outcome

**Outcome B: renderer path not available.** The repo has a proof pipeline, but it does not yet have the backend/API boundary, private renderer env contract, real external image generation service, durable media/artifact persistence, or final illustrated artifact path required for Level 2.
