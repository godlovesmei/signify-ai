# Signify AI Deployment Guide

## Recommended Production Shape

- App hosting: Vercel, root directory `apps/frontend`.
- Inference: YOLO11n exported to ONNX and executed in the browser with ONNX Runtime Web.
- Model assets: public, versioned static files under `apps/frontend/public/models/bisindo-yolo11n/v1/`.
- Runtime assets: ONNX Runtime WebAssembly files under `apps/frontend/public/ort/`.
- Auth and database: hosted Supabase project.
- Backend: not deployed for production in the current browser-only architecture.

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

`apps/backend` remains useful for local parity checks, backend contract tests,
and future server-side experiments. It is not required for the production
browser-only Vercel deployment.

If a future requirement says the model must remain private, this architecture is
not sufficient; inference must move back to a server-side runtime.

Run it locally only when needed:

```bash
conda activate signify-backend
uvicorn apps.backend.main:app --host 0.0.0.0 --port 8000 --reload
```
