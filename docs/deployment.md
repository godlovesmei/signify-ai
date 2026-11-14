# Signify AI Deployment Guide

## Recommended Production Shape

- App hosting: Vercel, root directory `apps/frontend`.
- Inference: YOLO11n exported to ONNX and executed in the browser with ONNX Runtime Web.
- Model assets: public, versioned static files under `apps/frontend/public/models/bisindo-yolo11n/v1/`.
- Runtime assets: ONNX Runtime WebAssembly files under `apps/frontend/public/ort/`.
- Auth and database: hosted Supabase project.
- Inference backend: not required for browser-based recognition.
- Dataset backend: separate Linux service for video validation and ingestion; see [Dataset production](#dataset-production).

There is no production FastAPI inference service in this browser-only shape. The
browser downloads `best.onnx`, captures webcam frames locally, runs inference on
device, and persists user data through Supabase.

## Public Model Artifact

The ONNX model is public by design. Anyone with browser access can download:

```text
/models/bisindo-yolo11n/v1/best.onnx
```

Current artifact:

```text
source: models/exports/bisindo_yolo/best.pt
export: apps/frontend/public/models/bisindo-yolo11n/v1/best.onnx
sha256: 259b08a8ba30ebd7e94ac48e533ccb97ac831501723c8edd4041b1e7cb213929
input: images [1, 3, 640, 640]
output: output0 [1, 30, 8400]
```

Re-export command:

```bash
conda run -n signify-yolo yolo export \
  model=models/exports/bisindo_yolo/best.pt \
  format=onnx \
  imgsz=640 \
  batch=1 \
  dynamic=False \
  nms=False \
  simplify=True
```

After export, copy the artifact into the frontend public model version:

```bash
cp models/exports/bisindo_yolo/best.onnx \
  apps/frontend/public/models/bisindo-yolo11n/v1/best.onnx
```

Model replacement flow:

```text
best.pt -> best.onnx -> apps/frontend/public/models/.../best.onnx
```

After copying the ONNX artifact, validate the browser inference path. Run the
legacy backend only when you want a local `.pt` comparison or contract test.

## Required Vercel Environment Variables

Set these in Vercel Project Settings for Preview and Production:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

Do not set `NEXT_PUBLIC_API_URL` for production browser inference. Do not place
`SUPABASE_JWT_SECRET` in Vercel frontend env variables.

If you create a local experiment that talks to `apps/backend`, keep it outside
the production translate/practice path and use a clearly named variable such as
`NEXT_PUBLIC_LEGACY_API_URL`. That variable is not required for Vercel.

## Vercel Deployment

1. Import the Git repository into Vercel.
2. Set Root Directory to `apps/frontend`.
3. Keep the framework preset as Next.js.
4. Let Vercel use the committed `pnpm-lock.yaml`; build command remains `pnpm build`.
5. Deploy a Preview first.
6. Validate camera permission and model loading on HTTPS.
7. Promote the validated Preview to Production.

The app serves the versioned ONNX and ORT WASM assets with immutable cache
headers. The model manifest is served with short cache headers so future model
versions can be discovered without forcing users to clear browser cache.

## Local Verification

Frontend only:

```bash
cd apps/frontend
pnpm install --frozen-lockfile
pnpm --filter frontend dev
```

Quality gates:

```bash
cd apps/frontend
pnpm --filter frontend lint
pnpm --filter frontend typecheck
pnpm --filter frontend test
pnpm --filter frontend build
pnpm --filter frontend test:e2e
```

Manual browser checks on a Vercel Preview:

- `/translate` requests camera access and starts detection.
- DevTools Network shows no calls to `/api/v1/translate/predict`.
- The browser downloads `/models/bisindo-yolo11n/v1/best.onnx` and `/ort/*.wasm`.
- Detections update the translate and practice UI.
- Translation history and practice stats still persist through Supabase.
- Reloading the page reuses cached model/runtime assets.

## Legacy Backend

The legacy inference backend remains useful for parity checks and experiments.
The separate dataset_main.py entrypoint is required for dataset contributions.

If a future requirement says the model must remain private, this architecture is
not sufficient; inference must move back to a server-side runtime.

Run it locally only when needed:

```bash
conda activate signify-backend
uvicorn apps.backend.main:app --host 0.0.0.0 --port 8000 --reload
```

## Dataset production

Frontend recognition remains browser-based. Dataset ingestion additionally needs
a backend with FFmpeg and persistent operation journals. It connects to the same
hosted Supabase project as the existing production frontend.

### One-time setup

1. Apply the five dataset migrations in chronological order to the existing hosted
   Supabase project, preserving its migration history. Check the migration diff
   against the target before applying; do not reset the production database.
   Start with 20261029090000_dataset_foundation.sql and finish with
   20261112140000_dataset_contributions_realtime.sql.
   Git push and CI database tests do not apply hosted migrations.
2. Create the Linux backend service. The root render.yaml is an optional Render
   Blueprint using apps/backend/Dockerfile.dataset. Render builds the image;
   Docker Desktop and local Supabase are not needed on the developer's computer.
   This Blueprint selects a paid service and persistent disk. Review its plan
   in Render before creating it; committing YAML creates no account/service.
3. Supply DATASET_SUPABASE_URL, DATASET_ANON_KEY,
   DATASET_SERVICE_ROLE_KEY and DATASET_ALLOWED_ORIGINS in backend hosting.
   The origin list is JSON, e.g. ["https://your-app.vercel.app"].
   For legacy HS256 user JWTs, also add DATASET_JWT_HS256_SECRET;
   ES256/RS256 uses the configured project's public JWKS.
   The Blueprint generates a stable DATASET_IDEMPOTENCY_SECRET.
4. Keep one backend instance and one worker. Mount persistent storage at
   /var/data, writable by container user UID 10001, and use
   DATASET_WORK_DIR=/var/data/dataset. Do not rotate the idempotency secret or
   erase operation journals while retries are pending. Backend storage must
   survive redeploy; an ephemeral serverless filesystem is unsuitable.
5. Set Vercel's NEXT_PUBLIC_DATASET_API_URL to the backend HTTPS origin and
   NEXT_PUBLIC_DATASET_LOCAL=false. Keep the current hosted Supabase URL and
   publishable key. Supply approved NEXT_PUBLIC_DATASET_CONSENT_VERSION and
   NEXT_PUBLIC_DATASET_CONSENT_TEXT, then rebuild.
6. Configure an approved active video policy on hosted Supabase, with duration
   3000-7000 ms, complete resolution/size/MIME limits and a valid creator profile.
   The foundation migration deliberately creates no active policy. The recorder
   stays unavailable until the policy and consent are configured. Do not use
   the development pilot's draft consent as production consent.
7. Assign registered reviewers through profiles.role = 'curator' as described
   in [the curator guide](Akses_Kurator_Supabase.md), and verify Google OAuth
   still redirects to the actual frontend domain.

The private dataset buckets, RLS and Realtime publication are defined by migrations.
Do not upload local pilot users/videos/credentials or use the local seed script
against production.

### Verification before promotion

On a Preview pointing to an appropriate hosted test environment, verify Google
login, contributor upload, exact-key upload retry, owner-only collection/playback,
cross-account denial, curator review and Realtime updates. Use data authorized for
that environment. GET /health only checks that the API process is available.

No production credentials, hosted schema changes or live upload verification are
performed by the repository preparation step.

Render references: [Blueprint specification](https://render.com/docs/blueprint-spec)
and [persistent disks](https://render.com/docs/disks).
