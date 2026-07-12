# TruthInStyle

TruthInStyle is a Next.js app for the CHAOTICA day-capsule workflow. It includes Supabase-backed entrance authorization and a server-only Day Capsule render boundary that can store final artifacts in Supabase Storage.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and use the opening gate. Protected app routes redirect to `/` until the Supabase-backed gate session is authorized.

## Required cloud environment

Configure these variables in Vercel before using the production gate or Day Capsule renderer:

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Gate auth and Supabase artifact storage | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Gate auth | Public anon key used by the server auth exchange. |
| `CHAOTICA_OWNER_EMAIL` | Gate auth | Owner email allowed through the opening gate. `SUPABASE_AUTH_OWNER_EMAIL` is accepted as a fallback. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase artifact storage | Server-only key. Do not expose to browser code. |
| `DAY_CAPSULE_RENDER_PROVIDER` | Internal render provider | Use `openai` for the built-in provider path. |
| `DAY_CAPSULE_RENDER_API_KEY` | Internal render provider | Server-only image provider key. |
| `DAY_CAPSULE_RENDER_MODEL` | Internal render provider | Optional; defaults to `gpt-image-1`. |
| `DAY_CAPSULE_RENDER_STORAGE_MODE` | Final render completion | Use `supabase` in production. |
| `DAY_CAPSULE_SUPABASE_BUCKET` | Supabase artifact storage | Defaults to `day-capsules` in code, but set it explicitly in Vercel. |
| `DAY_CAPSULE_SUPABASE_PUBLIC` | Artifact URL behavior | Set `true` only when the bucket is public; otherwise signed URLs are returned. |
| `DAY_CAPSULE_SUPABASE_SIGNED_URL_TTL_SECONDS` | Private artifact URL behavior | Optional signed URL lifetime. |
| `DAY_CAPSULE_RENDER_ENDPOINT` | External renderer fallback | Optional proxy endpoint when not using the internal provider. |
| `DAY_CAPSULE_RENDER_PROXY_TOKEN` | Render endpoint protection | Required when `DAY_CAPSULE_RENDER_ENDPOINT` is configured. |

## Cloud verification checklist

After Vercel has the environment variables above:

1. Redeploy the current branch in Vercel.
2. Visit the production URL and click the opening truth stone.
3. Confirm the Supabase authorization plaque appears when no session exists.
4. Authorize with the owner credential and confirm the oath screen appears.
5. Type or speak at least three oath phrases and confirm navigation to `/the-assurer`.
6. Open THE.SUMMATION with a prepared Day Capsule payload.
7. Start or retry the external render.
8. Confirm `POST /api/day-capsule-render` returns `external_rendered` and includes an artifact URL/path.
9. Confirm the visual artifact displays while the identity clump remains app-rendered text.

## Build verification

```bash
npm run build
```
