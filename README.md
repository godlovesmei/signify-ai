# Signify AI

> Real-time Indonesian Sign Language (BISINDO) recognition - webcam to text, in the browser.

Signify AI translates BISINDO (Bahasa Isyarat Indonesia) hand gestures into text in real time. A Next.js frontend captures webcam frames and runs a fine-tuned **YOLO11n** object detection model directly in the browser with ONNX Runtime Web. Frames stay on device; class labels and confidence scores feed the translate and practice workflows.

---

## Demo / Preview

| Translate Page | Detection |
|---|---|
| Real-time gesture → letter detection | YOLO11 bounding box overlay |

> Live demo: coming soon.

---

## Features

- **Real-time browser detection** - captures frames every 200 ms (300 ms on mobile) and runs YOLO11n ONNX locally
- **No frame upload** - inference runs on device with ONNX Runtime Web; the production app does not call `/api/v1/translate/predict`
- **Confidence-weighted voting** - 3-frame weighted vote buffer plus high-confidence fast-commit (>= 0.92) reduces flickering
- **Sentence builder** - accumulates predicted letters into words/sentences with TTS playback
- **Page Visibility API** - detection loop pauses when the tab is hidden to save CPU/GPU
- **Supabase persistence** - auth, translation history, and practice stats stay backed by Supabase RLS
- **Accessibility** - dark / light / system theme, high contrast, text scale, TTS speed/volume controls

---

## Tech Stack

### Frontend

| Library | Version | Purpose |
|---|---|---|
| Next.js | 16 | App framework (App Router) |
| React | 19 | UI |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| Radix UI | 1.4 | Component primitives |
| Supabase JS | 2 | Auth (SSR-safe client) |
| ONNX Runtime Web | 1.26 | Browser-side YOLO inference |
| Motion | 12 | Animations |
| Sonner | 2 | Toast notifications |

### Backend (local/parity only)

| Library | Version | Purpose |
|---|---|---|
| FastAPI | latest | REST API framework |
| Uvicorn | latest | ASGI server |
| Ultralytics | >= 8.3 | YOLO11 training, local inference, and ONNX export |
| PyTorch | 2.12 | ML runtime |
| OpenCV | latest | Image decode |
| PyJWT | 2.13 | Supabase JWT validation |
| Python | 3.11 | Runtime |

### ML

| Tool | Purpose |
|---|---|
| YOLO11n | Detection model (26 BISINDO letters) |
| Ultralytics | Training & export framework |
| ONNX | Browser deployment artifact |
| CUDA 12 + cuDNN | GPU acceleration |
| WandB | Experiment tracking (optional) |

### Database

| Service | Purpose |
|---|---|
| Supabase (PostgreSQL) | User profiles, translation history, practice stats |
| Supabase Auth | JWT-based authentication |
| Row Level Security | Per-user data isolation |

---

## Model Performance

Trained on the BISINDO dataset (26 letters A–Z) using YOLO11n for 84 epochs (early stopping at epoch 84/100).

| Metric | Value |
|---|---|
| mAP50 | **0.995** |
| mAP50-95 | **0.926** |
| Input size | 640 × 640 |
| Output classes | 26 (A–Z) |
| Browser runtime | ONNX Runtime WebGPU when available, WASM fallback |
| Inference latency | Device/browser dependent |

---

## Project Structure

```
signify-ai/
├── apps/
│   ├── frontend/                   # Next.js web application
│   │   ├── app/
│   │   │   ├── translate/          # Main translation workspace
│   │   │   ├── practice/           # Practice mode
│   │   │   ├── history/            # Translation history
│   │   │   ├── reference/          # BISINDO alphabet reference
│   │   │   └── auth/               # Login / Supabase callback
│   │   ├── components/
│   │   │   ├── features/translation/   # WebcamCapture, PredictionDisplay, SentenceBuilder
│   │   │   ├── layout/                 # Navbar, Footer, SettingsDrawer
│   │   │   ├── tts/                    # Text-to-speech button + indicator
│   │   │   └── ui/                     # Radix/shadcn primitives
│   │   ├── hooks/                  # useTheme, useAccessibilityPrefs
│   │   ├── public/
│   │   │   ├── models/bisindo-yolo11n/v1/best.onnx
│   │   │   └── ort/                # ONNX Runtime Web WASM assets
│   │   └── lib/                    # translateApi.ts, yolo*.ts, supabase.ts
│   │
│   └── backend/                    # Local/parity FastAPI inference service
│       ├── app/
│       │   ├── api/v1/endpoints/   # translation.py (predict, classes)
│       │   ├── api/deps.py         # JWT auth dependency
│       │   ├── config/settings.py  # Pydantic BaseSettings
│       │   └── services/ml_service.py  # YOLOService singleton
│       ├── tests/                  # pytest integration tests
│       ├── main.py                 # App entry point
│       └── environment.yml         # Conda dependencies
│
├── models/
│   └── exports/bisindo_yolo/
│       └── best.pt                 # YOLO11 trained weights (gitignored)
│
├── data/
│   └── bisindo/
│       ├── images/                 # Training images
│       ├── labels/                 # YOLO .txt label files
│       └── data.yml                # Dataset config
│
├── supabase/
│   └── migrations/
│       └── 20260422090000_init_signify_erd.sql  # Full schema + RLS
│
├── infrastructure/
│   ├── docker-compose.prod.yml
│   └── nginx/
│
├── docs/
│   └── database-erd.md
│
├── docker-compose.yml              # Local development stack
└── README.md
```

---

## Installation

### Prerequisites

- **Node.js 20+** and **pnpm**
- **Conda** (Miniconda or Anaconda)
- **CUDA 12+** (optional — required only for GPU inference)
- A **Supabase project** (free tier is fine)

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/signify-ai.git
cd signify-ai
```

### 2. Backend — Python environment

```bash
conda env create -f apps/backend/environment.yml
conda activate signify-backend
```

Or manually:

```bash
conda create -n signify-backend python=3.11
conda activate signify-backend
cd apps/backend
pip install ultralytics>=8.3.0 torch==2.12.0 torchvision==0.27.0 fastapi "uvicorn[standard]" \
    python-multipart pillow numpy opencv-python "PyJWT==2.13.0" pydantic-settings
```

### 3. Backend — Environment variables

```bash
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env.
# Keep SUPABASE_JWT_SECRET empty for local unauthenticated inference, or fill it
# and set REQUIRE_AUTH=true when you want Supabase JWT enforcement.
```

### 4. Frontend — Node environment

```bash
cd apps/frontend
pnpm install
cp .env.local.example .env.local
# Edit .env.local and fill in your Supabase URL and publishable key
```

### 5. Database — Supabase schema

Run the migration against your Supabase project:

```bash
# Using Supabase CLI
supabase db push

# Or apply every SQL file in supabase/migrations in timestamp order
```

### 6. Model weights

The trained YOLO11 weights are **not committed to git** (`.pt` files are in `.gitignore`).

If the weights already exist locally at `models/exports/bisindo_yolo/best.pt`, no action needed.

To re-train from scratch:
```bash
conda activate signify-backend
yolo train \
  model=yolo11n.pt \
  data=data/bisindo/data.yml \
  epochs=100 \
  imgsz=640 \
  batch=16 \
  device=0 \
  patience=20 \
  name=bisindo_v1 \
  project=runs/train

mkdir -p models/exports/bisindo_yolo
cp runs/train/bisindo_v1/weights/best.pt models/exports/bisindo_yolo/best.pt
```

---

## Running the Project

### Development

**Backend (optional local parity)** - runs on `http://localhost:8000`

```bash
conda activate signify-backend
uvicorn apps.backend.main:app --host 0.0.0.0 --port 8000 --reload
```

The production inference path does not need this backend. Use it only for local
backend tests, parity checks, or server-side inference experiments.

**Frontend** - runs on `http://localhost:3000`

```bash
cd apps/frontend
pnpm dev
```

### Docker (full local stack)

```bash
docker-compose up --build
```

### Production

Deploy the Next.js app to Vercel with Root Directory `apps/frontend`. The ONNX
model and ONNX Runtime Web WASM assets are served as public static files from
the same Vercel deployment. See [`docs/deployment.md`](docs/deployment.md).

### Testing and quality gates

The complete production-readiness plan and TC-001 through TC-026 traceability
matrix are documented in [`docs/rencana-pengujian.md`](docs/rencana-pengujian.md).

```bash
cd apps/frontend
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
pnpm test:e2e

cd ../backend
python -m pytest -q --cov=app --cov-branch --cov-report=json:coverage.json
python scripts/check_coverage.py coverage.json

cd ../..
supabase db reset
supabase test db
supabase db lint --level warning
```

Staging performance profiles live in `tests/performance/locustfile.py`.

---

## Browser Inference Contract

Production inference is a browser-only contract exposed by
`apps/frontend/lib/translateApi.ts`:

```ts
predictFromVideoFrame(video, canvas) => Promise<{
  detections: Array<{
    class: string;
    confidence: number;
    box: { x1: number; y1: number; x2: number; y2: number };
  }>;
  inference_ms: number;
  model: "best.onnx";
} | null>
```

The browser pipeline loads `/models/bisindo-yolo11n/v1/best.onnx`, converts a
640 x 640 canvas frame to a `1x3x640x640` tensor, runs ONNX Runtime Web, applies
confidence filtering and class-aware NMS, then returns the same detection shape
that the UI previously received from FastAPI.

## Legacy API Reference

Interactive Swagger docs are available at `http://localhost:8000/docs` after
starting the optional local backend. These endpoints are not used by the
production Vercel browser inference path.

### `POST /api/v1/translate/predict`

Run YOLO11 inference on a single image frame in the optional local backend.

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | image (JPEG / PNG / WebP) | Raw webcam frame, max 2 MB |

**Response:**
```json
{
  "detections": [
    {
      "class": "A",
      "confidence": 0.987,
      "box": { "x1": 120.5, "y1": 80.2, "x2": 310.1, "y2": 450.8 }
    }
  ],
  "inference_ms": 18.4,
  "model": "best.pt"
}
```

**Error codes:**

| Code | Meaning |
|---|---|
| 400 | Unsupported image format |
| 413 | File exceeds 2 MB |
| 422 | Image decode failed |

### `GET /api/v1/translate/classes`

Returns all 26 recognizable BISINDO letter classes.

```json
{
  "classes": { "0": "A", "1": "B", "...", "25": "Z" },
  "total": 26
}
```

### `GET /health`

```json
{
  "status": "ok",
  "model": "models/exports/bisindo_yolo/best.pt",
  "classes": 26,
  "loaded_at": 1745200000.0
}
```

---

## Configuration

### Backend (`apps/backend/.env`, optional local parity)

```dotenv
# Model
MODEL_PATH=models/exports/bisindo_yolo/best.pt
INPUT_SIZE=640
CONFIDENCE_THRESHOLD=0.5

# CORS - comma-separated allowed origins
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Auth - Supabase JWT.
# Keep SUPABASE_JWT_SECRET empty when REQUIRE_AUTH=false for local dev.
# Set both SUPABASE_JWT_SECRET and REQUIRE_AUTH=true for auth enforcement.
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=
REQUIRE_AUTH=false
```

### Frontend (`apps/frontend/.env.local`)

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

---

## Detection Pipeline

```
Browser (webcam)
  └─ captureImageData()            - draws video to 640 x 640 canvas
      └─ yoloPreprocess.ts         - converts RGBA to normalized RGB BCHW tensor
          └─ ONNX Runtime Web      - WebGPU when available, WASM fallback
              └─ yoloPostprocess.ts
                  └─ confidence filter + class-aware NMS
                      └─ { detections, inference_ms }
Browser UI
  └─ WebcamCapture.tsx             - shows live detection status
  └─ Weighted vote buffer          - 3-frame quorum before committing a letter
  └─ SentenceBuilder               - accumulates committed letters
```

---

## Database Schema

The versioned Supabase schema lives in `supabase/migrations/`.

| Table | Purpose |
|---|---|
| `profiles` | User profile (auto-created on sign-up) |
| `model_versions` | ML model registry with active flag |
| `letters` | BISINDO alphabet A–Z (seeded) |
| `translation_sessions` | Per-session records (webcam / upload / API) |
| `translation_entries` | Individual letter detections per session |
| `practice_attempts` | Per-letter practice correctness records |
| `user_preferences` | Theme, contrast, text scale, TTS settings |

All tables have Row Level Security — users can only access their own data.

See `docs/database-erd.md` for the full entity-relationship diagram.

---

## Roadmap

- [ ] Expand to dynamic gestures (words / phrases beyond alphabet)
- [ ] Support two-hand BISINDO signs
- [x] Browser inference with ONNX Runtime Web
- [ ] Offline PWA shell for cached model/runtime assets
- [ ] Improve browser inference speed with quantized or ORT-optimized artifacts
- [ ] User contribution flow with active-learning review queue
- [ ] CI/CD pipeline with automated test and deploy
- [ ] Docker Compose full-stack setup with GPU passthrough

---

## License

All rights reserved. No open-source license is currently applied.

---

## Author

**Meiske Priskilla Sahertian**

---

## Acknowledgements

- [Ultralytics YOLO](https://github.com/ultralytics/ultralytics) — YOLO11 training & inference
- [ONNX Runtime Web](https://onnxruntime.ai/) — browser inference runtime
- [Supabase](https://supabase.com/) — open-source auth and database
- [Radix UI](https://www.radix-ui.com/) — accessible component primitives
- [shadcn/ui](https://ui.shadcn.com/) — component library
