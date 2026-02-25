### **Signify-AI Monorepo Structure**
```
signify-ai/
│
├── apps/
│   ├── frontend/                   # Next.js web app
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── translate/
│   │   │   │   └── history/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/radix primitives
│   │   │   └── features/
│   │   │       ├── translation/
│   │   │       │   ├── WebcamCapture.tsx
│   │   │       │   ├── LandmarkOverlay.tsx
│   │   │       │   └── PredictionDisplay.tsx
│   │   │       └── auth/
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   │   ├── useWebcam.ts
│   │   │   │   └── useWebSocket.ts
│   │   │   └── types/
│   │   ├── public/
│   │   ├── .env.example
│   │   ├── next.config.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── backend/                    # FastAPI service
│       ├── app/
│       │   ├── main.py
│       │   ├── config/
│       │   │   ├── settings.py     # Pydantic BaseSettings
│       │   │   └── database.py
│       │   ├── api/
│       │   │   └── v1/
│       │   │       ├── router.py
│       │   │       └── endpoints/
│       │   │           ├── auth.py
│       │   │           ├── translation.py
│       │   │           ├── websocket.py
│       │   │           └── health.py
│       │   ├── core/
│       │   │   ├── security.py
│       │   │   └── exceptions.py
│       │   ├── models/             # SQLAlchemy ORM models
│       │   │   ├── user.py
│       │   │   └── prediction.py
│       │   ├── schemas/            # Pydantic request/response
│       │   │   ├── auth.py
│       │   │   └── translation.py
│       │   ├── services/
│       │   │   ├── auth_service.py
│       │   │   └── ml_service.py   # loads model, runs inference
│       │   └── repositories/
│       │       ├── user_repository.py
│       │       └── prediction_repository.py
│       ├── alembic/
│       │   └── versions/
│       ├── tests/
│       │   ├── conftest.py
│       │   └── unit/
│       ├── .env.example
│       ├── Dockerfile
│       ├── pyproject.toml
│       └── requirements.txt
│
├── ml/                             # All ML work: training, eval, export
│   ├── data/
│   │   ├── loader.py               # unified loader across datasets
│   │   ├── preprocessing.py        # MediaPipe landmark extraction
│   │   ├── augmentation.py
│   │   └── tfod_converter.py       # converts TFOD format → sequences
│   ├── models/
│   │   ├── base.py                 # abstract model interface
│   │   ├── lstm.py                 # landmark sequence → class
│   │   └── cnn_lstm.py             # optional image+sequence hybrid
│   ├── training/
│   │   ├── trainer.py
│   │   ├── callbacks.py
│   │   └── metrics.py
│   ├── inference/
│   │   ├── predictor.py            # used by backend ml_service.py
│   │   └── postprocessing.py
│   ├── experiments/                # one folder per run (gitignored bulk)
│   │   └── .gitkeep
│   ├── configs/
│   │   ├── base.yaml
│   │   └── lstm_bisindo.yaml       # per-experiment overrides
│   ├── scripts/
│   │   ├── extract_landmarks.py    # batch MediaPipe preprocessing
│   │   ├── train.py
│   │   ├── evaluate.py
│   │   └── export.py               # → ONNX or TFLite
│   ├── tests/
│   ├── pyproject.toml
│   └── requirements.txt
│
├── data/                           # Raw and processed datasets (DVC-tracked)
│   ├── README.md                   # document each dataset's origin + license
│   ├── bisindo_v1/                 # your current dataset
│   │   ├── raw/                    # original TFOD format (images + XMLs)
│   │   │   ├── train/
│   │   │   ├── valid/
│   │   │   └── test/
│   │   ├── landmarks/              # extracted .npy sequence files
│   │   │   ├── train/
│   │   │   ├── valid/
│   │   │   └── test/
│   │   └── metadata.json           # classes, counts, source info
│   │
│   └── _template/                  # copy this when adding a new dataset
│       ├── raw/
│       ├── landmarks/
│       └── metadata.json
│
├── models/                         # Trained model artifacts (DVC-tracked)
│   ├── bisindo_v1/
│   │   ├── checkpoints/            # .pth or .h5 per epoch
│   │   ├── best/
│   │   │   └── model_best.pth
│   │   └── exported/
│   │       ├── model.onnx          # what the backend loads
│   │       └── model_metadata.json # classes, input shape, version
│   └── _template/
│
├── infrastructure/
│   ├── docker-compose.yml          # local dev: frontend + backend + db
│   ├── docker-compose.prod.yml     # prod: same but with env overrides
│   └── nginx/
│       └── nginx.conf              # reverse proxy for frontend + API
│
├── docs/
│   ├── architecture.md
│   ├── setup.md                    # how to run locally
│   ├── training.md                 # how to train a model
│   └── api/
│       └── openapi.yaml
│
├── scripts/
│   ├── setup-dev.sh
│   └── migrate-db.sh
│
├── .dvc/                           # DVC config (tracks data/ and models/)
├── .gitignore
├── .env.example
├── docker-compose.yml              # symlink or copy of infrastructure/
├── Makefile                        # `make train`, `make dev`, `make deploy`
├── pnpm-workspace.yaml
├── turbo.json
└── README.md