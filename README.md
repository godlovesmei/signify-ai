# Signify AI

> Real-time Indonesian Sign Language (BISINDO) recognition — from webcam to text, in the browser.

Signify AI is a full-stack application that translates BISINDO (Bahasa Isyarat Indonesia) hand gestures into text in real time. A Next.js frontend captures hand gestures via webcam, MediaPipe detects hand landmarks, and a FastAPI backend runs inference using a fine-tuned EfficientNetV2B0 CNN model.

---

## Demo / Preview

| Translate Page | How It Works |
|---|---|
| Real-time gesture → letter detection | Two-phase CNN pipeline |

> Live demo: coming soon.

---

## Features

- **Real-time recognition** — captures webcam frames at 200 ms intervals (300 ms on mobile) and predicts the signed letter
- **Dynamic hand ROI** — MediaPipe landmarks crop the hand region precisely; falls back to a static guide box
- **Canonical CNN preprocessing** — frontend sends a cropped frame, backend applies the single source of truth preprocessing for model input
- **Confidence-weighted voting** — 3-frame weighted vote buffer plus high-confidence fast-commit reduces flickering predictions
- **Sentence builder** — accumulates predicted letters into a word/sentence with TTS playback
- **Mobile optimised** — CPU delegate, reduced frame rate, and Page Visibility API pause on tab hide
- **Optional auth** — Supabase JWT gating on the API (toggle with `REQUIRE_AUTH`)
- **Data collection page** — for contributing new gesture samples

---

## Tech Stack

### Frontend
| Library | Version | Purpose |
|---|---|---|
| Next.js | 16 | App framework (App Router) |
| React | 19 | UI |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| shadcn/ui + Radix UI | latest | Component primitives |
| MediaPipe Vision | 0.10 | In-browser hand landmark detection |
| Supabase JS | 2 | Auth (SSR-safe client) |
| Sonner | 2 | Toast notifications |

### Backend
| Library | Version | Purpose |
|---|---|---|
| FastAPI | latest | REST API framework |
| Uvicorn | latest | ASGI server |
| TensorFlow | 2.16.2 | Model inference |
| Pydantic Settings | latest | Configuration management |
| Python | 3.11 | Runtime |

### ML
| Tool | Purpose |
|---|---|
| EfficientNetV2B0 | Base CNN (ImageNet pretrained) |
| TensorFlow / Keras | Training framework |
| CUDA 12.3 + cuDNN 8.9.7 | GPU acceleration |
| FP16 mixed precision | Faster training |
| Roboflow | Dataset preprocessing |
| WandB | Experiment tracking (optional) |

---

## Project Structure

```
signify-ai/
├── apps/
│   ├── frontend/                   # Next.js web application
│   │   ├── app/
│   │   │   ├── translate/          # Main translation page
│   │   │   ├── collect/            # Data collection page
│   │   │   ├── auth/               # Login / Supabase callback
│   │   │   └── (documentation)/    # How-it-works, research, terms
│   │   ├── components/
│   │   │   ├── features/translation/   # Webcam, prediction, sentence builder
│   │   │   ├── layout/                 # Navbar, Footer, SettingsDrawer
│   │   │   ├── tts/                    # Text-to-speech button + indicator
│   │   │   └── ui/                     # shadcn primitives
│   │   ├── hooks/                  # useTheme, useAccessibilityPrefs
│   │   ├── lib/                    # handROI.ts, imagePreprocess.ts, supabase.ts
│   │   └── utils/supabase/         # SSR-safe Supabase helpers
│   │
│   └── backend/                    # FastAPI inference service
│       ├── app/
│       │   ├── api/v1/endpoints/   # translation.py (predict, classes)
│       │   ├── config/settings.py  # Pydantic BaseSettings
│       │   └── services/ml_service.py  # Model singleton + inference
│       ├── tests/                  # Integration tests
│       ├── main.py                 # App entry point
│       └── Dockerfile
│
├── packages/
│   └── ml/                         # ML pipeline
│       ├── data/
│       │   ├── preprocessing.py    # tf_preprocess, tf_augment
│       │   ├── dataset.py          # tf.data pipeline builder
│       │   └── augmentation.py
│       ├── training/
│       │   ├── trainer.py          # TrainerConfig + Trainer class
│       │   ├── callbacks.py        # LR schedule, checkpoint, TensorBoard
│       │   └── metrics.py
│       ├── scripts/
│       │   ├── train.py            # Main training entry point
│       │   ├── export_model.py     # .keras → SavedModel
│       │   ├── prepare_bisindo.py  # Dataset preparation
│       │   ├── create_label_map.py
│       │   ├── extract_landmarks.py
│       │   └── generate_visualizations.py
│       └── analysis/gradcam.py     # Grad-CAM visualizations
│
├── data/
│   ├── raw/                        # Original images (gitignored)
│   ├── processed/bisindo_v1/       # Training-ready CSVs + label map
│   ├── augmented/                  # Augmented copies (gitignored)
│   └── metadata/
│
├── models/
│   ├── checkpoints/bisindo_v2_ls/  # Training checkpoints (gitignored)
│   ├── exports/bisindo_v2_ls/      # SavedModel for inference (gitignored)
│   └── hand_landmarker.task        # MediaPipe model
│
├── infrastructure/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── nginx/
│
├── scripts/                        # Dev / deploy utility scripts
├── reports/figures/                # Generated training visualizations
└── docs/                           # Additional documentation
```

---

## Installation

### Prerequisites

- Node.js 20+
- Python 3.11
- Conda (recommended for ML environment)
- CUDA 12.3 + cuDNN 8.9.7 (for GPU training, optional for inference)

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/signify-ai.git
cd signify-ai
```

### 2. One-command development setup (recommended)

```bash
bash scripts/setup-dev.sh
```

Include ML environment when needed:

```bash
WITH_ML=1 bash scripts/setup-dev.sh
```

### 3. Frontend (manual)

```bash
cd apps/frontend
pnpm install
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_API_URL and Supabase keys
```

### 4. Backend (manual)

```bash
cd apps/backend
cp .env.example .env               # fill in model paths and optional Supabase config
conda env create -f environment.yml
conda activate signify-backend
```

Model artifacts tidak ikut Git. Setelah clone/fetch, export ulang model:
```bash
cd /path/to/signify-ai
python packages/ml/scripts/export_model.py \
  --checkpoint models/checkpoints/bisindo_v2_ls/phase2_best.weights.h5 \
  --output_dir models/exports/bisindo_v2_ls
```

### 5. ML Environment (for training only)

```bash
cd packages/ml
conda env create -f environment.yml
conda activate signify-ml
```

---

## Usage / Running the Project

### Development

**Frontend** (http://localhost:3000)
```bash
cd apps/frontend
npm run dev
```

**Backend** (http://localhost:8000)
```bash
cd apps/backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Docker (all services)

```bash
docker-compose up --build
```

### Production

```bash
docker-compose -f infrastructure/docker-compose.prod.yml up -d
```

---

## API Documentation

Interactive docs available at `http://localhost:8000/docs` (Swagger UI) after starting the backend.

### Endpoints

#### `POST /api/v1/translate/predict`

Runs inference on a hand gesture image.

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | image (PNG/JPEG/WebP) | Cropped hand image, max 1 MB |

**Response:**
```json
{
  "prediction": "A",
  "confidence": 0.987,
  "top_k": [
    { "class": "A", "confidence": 0.987 },
    { "class": "B", "confidence": 0.008 },
    { "class": "C", "confidence": 0.003 }
  ],
  "inference_ms": 45.2,
  "low_confidence": false
}
```

**Error codes:**

| Code | Meaning |
|---|---|
| 400 | Invalid image format |
| 413 | File too large (> 1 MB) |
| 422 | Image processing error |
| 503 | Model not loaded |

---

#### `GET /api/v1/translate/classes`

Returns all recognizable classes.

```json
{
  "classes": { "A": 0, "B": 1, "...", "Z": 25 },
  "total": 26
}
```

---

#### `GET /health`

Health check and model status.

```json
{
  "status": "ok",
  "model": "models/exports/bisindo_v2_ls/saved_model",
  "classes": 26,
  "loaded_at": 1234567890.5
}
```

---

## Machine Learning Pipeline

### Architecture

Base model: **EfficientNetV2B0** (ImageNet pretrained, input 224×224×3)

```
EfficientNetV2B0 (base, frozen in Phase 1)
  └── GlobalAveragePooling2D
      └── BatchNormalization
          └── Dropout(0.3)
              └── Dense(256, relu)
                  └── Dropout(0.15)
                      └── Dense(26, softmax)  →  A–Z
```

### Two-Phase Transfer Learning

**Phase 1 — Feature Extraction** (base frozen)
- Optimizer: AdamW (`lr=1e-3`, `weight_decay=1e-4`)
- Epochs: 15 (default)
- Callback: ReduceLROnPlateau on `val_accuracy`

**Phase 2 — Fine-tuning** (unfreeze from layer 240 onward)
- Optimizer: AdamW + CosineDecay with linear warmup
- LR schedule: `1e-5` → cosine anneal to `1e-7` (2-epoch warmup)
- Epochs: 30 (default)
- FP16 mixed precision enabled

### Preprocessing

```
Raw image → resize 224×224 → normalize [0, 1]
```

Augmentation (training only):
1. Random brightness (±0.15)
2. Random contrast (0.8–1.2)
3. Random JPEG quality (70–100) — simulates webcam compression
4. Gamma correction (0.7–1.4) — simulates non-linear camera response
5. Gaussian noise σ=0.02, 50% probability — simulates sensor noise

> No horizontal flip — flipping changes BISINDO hand orientation and breaks class semantics.

### Training

```bash
python packages/ml/scripts/train.py \
  --train_csv data/processed/bisindo_v1/manifests/train.csv \
  --val_csv   data/processed/bisindo_v1/manifests/valid.csv \
  --test_csv  data/processed/bisindo_v1/manifests/test.csv \
  --num_classes 26 \
  --batch_size 32 \
  --phase1_epochs 15 \
  --phase2_epochs 30
```

Resume from checkpoint:
```bash
python packages/ml/scripts/train.py \
  --resume_weights models/checkpoints/bisindo_v2_ls/phase1_best.weights.h5 \
  --initial_epoch 12
```

Export to SavedModel:
```bash
python packages/ml/scripts/export_model.py
```

---

## Model Performance

Evaluated on the held-out test split (BISINDO v1 dataset, 26 classes A–Z).

| Metric | Value |
|---|---|
| Overall test accuracy | ~97% |
| Average inference latency | ~45 ms |
| Model input size | 224×224 |
| Output classes | 26 (A–Z) |

**Per-class highlights:**

| Class | Accuracy | Notes |
|---|---|---|
| A, C, E, F, G, K, M, Q, R, S, T, V, X, Y, Z | 100% | — |
| I, J, L, N, U, W | 97–98% | Minimal confusion |
| H, O | 91–95% | H↔B, O↔V confusion |
| B, D, P | 85–87% | D↔P most frequent confusion pair |

> Full per-class classification report: `models/checkpoints/bisindo_v2_ls/test_classification_report.csv`

---

## Configuration

### Backend (`.env`)

```dotenv
# Model
SAVED_MODEL_PATH=models/exports/bisindo_v2_ls/saved_model
LABEL_MAP_PATH=models/exports/bisindo_v2_ls/label_map.json

# Inference
INPUT_SIZE=224
TOP_K=3
CONFIDENCE_THRESHOLD=0.55

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Auth (Supabase JWT — leave empty to disable)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret
REQUIRE_AUTH=false
```

### Frontend (`.env.local`)

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### ML Trainer (`TrainerConfig` defaults)

| Parameter | Default | Description |
|---|---|---|
| `batch_size` | 32 | Training batch size |
| `phase1_epochs` | 15 | Feature extraction epochs |
| `phase2_epochs` | 30 | Fine-tuning epochs |
| `phase1_lr` | 1e-3 | Phase 1 learning rate |
| `phase2_lr` | 1e-5 | Phase 2 initial LR |
| `dropout_rate` | 0.3 | Head dropout |
| `unfreeze_from_layer` | 240 | Phase 2 unfreeze start |
| `mixed_precision` | true | FP16 training |
| `seed` | 42 | Reproducibility seed |

---

## Scripts / Commands

### Frontend
```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```

### Backend
```bash
uvicorn main:app --reload                          # Dev server
uvicorn main:app --host 0.0.0.0 --port 8000        # Production
python -m pytest tests/                            # Run tests
```

### ML
```bash
# Dataset
python packages/ml/scripts/prepare_bisindo.py      # Prepare raw dataset
python packages/ml/scripts/create_label_map.py     # Generate label map

# Training
python packages/ml/scripts/train.py                # Train with defaults
python packages/ml/scripts/export_model.py         # Export to SavedModel

# Analysis
python packages/ml/scripts/generate_visualizations.py  # Post-training figures
python packages/ml/analysis/gradcam.py             # Grad-CAM visualizations
python scripts/test_inference_static.py            # Inference smoke test
```

---

## Dataset

**Name:** BISINDO v1 — Indonesian Sign Language Alphabet

**Classes:** 26 letters (A–Z) of the BISINDO manual alphabet

**Preprocessing (Roboflow):**
- Images cropped to hand region
- Resized to 244×244 → 224×224 for model input
- Grayscale encoding (R=G=B channels)

**Splits:**

| Split | Manifest |
|---|---|
| Train | `data/processed/bisindo_v1/manifests/train.csv` |
| Validation | `data/processed/bisindo_v1/manifests/valid.csv` |
| Test | `data/processed/bisindo_v1/manifests/test.csv` |

Each manifest row: `filepath,label`

---

## Roadmap / Future Work

- [ ] Expand to dynamic gestures (words / phrases beyond alphabet)
- [ ] Support two-hand BISINDO signs
- [ ] Offline PWA mode (model served via ONNX / TFJS in browser)
- [ ] Real-time TTS for full sentences
- [ ] User contribution flow with active-learning review queue
- [ ] Improve D↔P and B↔H confusion with targeted data collection
- [ ] Docker Compose full-stack setup (frontend + backend + nginx)
- [ ] CI/CD pipeline with automated test and deploy

---

## License

This project does not currently include an open-source license. All rights reserved.

---

## Author

**Meiske Priskilla Sahertian**
[meiskesahertian7@gmail.com](mailto:meiskesahertian7@gmail.com)

---

## Acknowledgements

- [MediaPipe](https://mediapipe.dev/) — hand landmark detection
- [Roboflow](https://roboflow.com/) — dataset management and preprocessing
- [EfficientNetV2](https://arxiv.org/abs/2104.00298) — Mingxing Tan & Quoc V. Le (Google Brain)
- [shadcn/ui](https://ui.shadcn.com/) — accessible component library
- [Supabase](https://supabase.com/) — open-source auth and database
