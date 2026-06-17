# Signify AI Legacy Backend

`apps/backend` is an optional legacy/dev-only FastAPI service for server-side
YOLO `.pt` inference.

It is useful for:

- local parity checks against the browser ONNX model
- backend API contract tests
- debugging server-side YOLO output
- future server-side inference experiments

It is not used by the production Vercel deployment. The production app lives in
`apps/frontend` and runs inference in the browser with ONNX Runtime Web. Do not
make frontend production build, test, or deploy steps depend on this service.

## Run Locally

From the repository root:

```bash
conda activate signify-backend
uvicorn apps.backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Then open:

```text
http://localhost:8000/docs
```

## Test

```bash
cd apps/backend
python -m pytest tests -q
```

Optional model parity checks can be enabled with `RUN_MODEL_PARITY=1` when the
local `.pt`, ONNX artifact, and runtime dependencies are available.
