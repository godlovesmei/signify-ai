# Signify AI

> Real-time Indonesian Sign Language (BISINDO) recognition — webcam to text, in the browser.

Signify AI translates BISINDO (Bahasa Isyarat Indonesia) hand gestures into text in real time. A Next.js frontend captures raw webcam frames and sends them to a FastAPI backend that runs inference with a fine-tuned **YOLO11** object detection model. Bounding boxes and class labels are streamed back and rendered directly on the video feed.

---

## Demo / Preview

| Translate Page | Detection |
|---|---|
| Real-time gesture → letter detection | YOLO11 bounding box overlay |

> Live demo: coming soon.

---

## Features

- **Real-time detection** — captures frames every 200 ms (300 ms on mobile) and returns YOLO bounding boxes with confidence scores
- **No MediaPipe** — hand detection and classification are both handled by YOLO11 on the backend; the browser sends raw frames
- **Confidence-weighted voting** — 3-frame weighted vote buffer plus high-confidence fast-commit (≥ 0.92) reduces flickering
- **Sentence builder** — accumulates predicted letters into words/sentences with TTS playback
- **Page Visibility API** — detection loop pauses when the tab is hidden to save CPU/GPU
- **Optional auth** — Supabase JWT gating on `/predict` (toggle with `REQUIRE_AUTH=true`)
- **Accessibility** — dark / light / system theme, high contrast, text scale, TTS speed/volume controls

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
| Motion | 12 | Animations |
| Sonner | 2 | Toast notifications |

### Backend

| Library | Version | Purpose |
|---|---|---|
| FastAPI | latest | REST API framework |
| Uvicorn | latest | ASGI server |
| Ultralytics | ≥ 8.3 | YOLO11 inference |
| PyTorch | ≥ 2.0 | ML runtime |
| OpenCV | latest | Image decode |
| PyJWT | 2.9 | Supabase JWT validation |
| Python | 3.11 | Runtime |

### ML

| Tool | Purpose |
|---|---|
| YOLO11n | Detection model (26 BISINDO letters) |
| Ultralytics | Training & export framework |
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
| Inference latency (GPU) | ~15–25 ms |
| Inference latency (CPU) | ~80–150 ms |

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
│   │   └── lib/                    # translateApi.ts, imagePreprocess.ts, supabase.ts
│   │
│   └── backend/                    # FastAPI inference service
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
conda create -n signify-yolo python=3.11
conda activate signify-yolo
cd apps/backend
pip install ultralytics>=8.3.0 torch torchvision fastapi "uvicorn[standard]" \
    python-multipart pillow numpy opencv-python "PyJWT==2.9.0" pydantic-settings
```

Or use the provided Conda environment file:

```bash
conda env create -f apps/backend/environment.yml
conda activate signify-yolo
```

### 3. Backend — Environment variables

```bash
cp apps/backend/.env.example apps/backend/.env
# Edit .env and fill in your Supabase JWT secret if you want auth
```

### 4. Frontend — Node environment

```bash
cd apps/frontend
pnpm install
cp .env.local.example .env.local
# Edit .env.local and fill in your Supabase URL and anon key
```

### 5. Database — Supabase schema

Run the migration against your Supabase project:

```bash
# Using Supabase CLI
supabase db push

# Or paste the contents of the file directly in Supabase SQL Editor
# supabase/migrations/20260422090000_init_signify_erd.sql
```

### 6. Model weights

The trained YOLO11 weights are **not committed to git** (`.pt` files are in `.gitignore`).

If the weights already exist locally at `models/exports/bisindo_yolo/best.pt`, no action needed.

To re-train from scratch:
```bash
conda activate signify-yolo
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

**Backend** — runs on `http://localhost:8000`

```bash
conda activate signify-yolo
cd apps/backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend** — runs on `http://localhost:3000`

```bash
cd apps/frontend
pnpm dev
```

### Docker (full local stack)

```bash
docker-compose up --build
```

### Production

```bash
docker-compose -f infrastructure/docker-compose.prod.yml up -d
```

---

## API Reference

Interactive Swagger docs are available at `http://localhost:8000/docs` after starting the backend.

### `POST /api/v1/translate/predict`

Run YOLO11 inference on a single image frame.

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

### Backend (`apps/backend/.env`)

```dotenv
# Model
MODEL_PATH=models/exports/bisindo_yolo/best.pt
INPUT_SIZE=640
CONFIDENCE_THRESHOLD=0.5

# CORS — comma-separated allowed origins
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Auth — Supabase JWT (leave empty to run without auth)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret
REQUIRE_AUTH=false
```

### Frontend (`apps/frontend/.env.local`)

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Detection Pipeline

```
Browser (webcam)
  └─ captureFrame()        — draws video to 640×640 canvas → JPEG blob
      └─ POST /api/v1/translate/predict
          └─ FastAPI
              └─ cv2.imdecode()
                  └─ YOLOService.predict()   — YOLO11 inference
                      └─ { detections, inference_ms }
Browser
  └─ WebcamCapture.tsx     — renders bounding boxes as CSS divs over video
  └─ Weighted vote buffer  — 3-frame quorum before committing a letter
  └─ SentenceBuilder       — accumulates committed letters
```

---

## Database Schema

The Supabase schema lives in `supabase/migrations/20260422090000_init_signify_erd.sql`.

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
- [ ] Offline PWA mode (ONNX in browser via ONNX Runtime Web)
- [ ] Improve inference speed with TensorRT / CoreML export
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
- [Supabase](https://supabase.com/) — open-source auth and database
- [Radix UI](https://www.radix-ui.com/) — accessible component primitives
- [shadcn/ui](https://ui.shadcn.com/) — component library
