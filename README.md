### **Signify-AI Monorepo Structure**
```
signify-ai/
│
├── apps/
│   ├── frontend/                   # Next.js web app
│   │   ├── app/
│   │   │   ├── (documentation)/
│   │   │   │   ├── how-it-works/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── research/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── sections/   # 10 section components
│   │   │   │   └── terms-condition/
│   │   │   │       └── page.tsx
│   │   │   ├── auth/
│   │   │   │   ├── callback/
│   │   │   │   │   └── route.ts
│   │   │   │   └── login/
│   │   │   │       └── page.tsx
│   │   │   ├── collect/
│   │   │   │   ├── _content.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── translate/
│   │   │   │   ├── _content.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx            # Landing page
│   │   │
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── AuthGuard.tsx
│   │   │   │   └── LoginModal.tsx
│   │   │   ├── features/
│   │   │   │   └── translation/
│   │   │   │       ├── WebcamCapture.tsx
│   │   │   │       ├── LandmarkOverlay.tsx
│   │   │   │       ├── PredictionDisplay.tsx
│   │   │   │       ├── PredictionBadge.tsx
│   │   │   │       ├── SentenceBuilder.tsx
│   │   │   │       ├── DetectionStatus.tsx
│   │   │   │       ├── DeleteControls.tsx
│   │   │   │       ├── drawingUtils.ts
│   │   │   │       └── index.ts
│   │   │   ├── layout/
│   │   │   │   ├── LandingNavbar.tsx   # Marketing nav (transparent, scroll-aware)
│   │   │   │   ├── Navbar.tsx          # App nav (mode tabs, settings, avatar)
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── SettingsDrawer.tsx
│   │   │   ├── tts/
│   │   │   │   ├── TTSButton.tsx
│   │   │   │   └── TTSSpeakingIndicator.tsx
│   │   │   └── ui/                 # shadcn/radix primitives
│   │   │       ├── Logo.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── progress.tsx
│   │   │       ├── sheet.tsx
│   │   │       ├── slider.tsx
│   │   │       ├── sonner.tsx
│   │   │       ├── tabs.tsx
│   │   │       └── toggle.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAccessibilityPrefs.ts
│   │   │   └── useTheme.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── utils/
│   │   │   └── supabase/
│   │   │       ├── client.ts
│   │   │       ├── middleware.ts
│   │   │       └── server.ts
│   │   │
│   │   ├── public/
│   │   ├── .env.local
│   │   ├── components.json
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── backend/                    # FastAPI service
│       ├── app/
│       │   ├── api/
│       │   │   ├── deps.py
│       │   │   └── v1/
│       │   │       └── endpoints/
│       │   │           └── translation.py
│       │   ├── config/
│       │   │   └── settings.py     # Pydantic BaseSettings
│       │   ├── core/
│       │   ├── models/
│       │   ├── schemas/
│       │   ├── services/
│       │   │   └── ml_service.py   # loads model, runs inference
│       │   └── utils/
│       ├── tests/
│       ├── .env
│       ├── .env.example
│       ├── Dockerfile
│       ├── main.py
│       └── pyproject.toml
│
├── packages/
│   ├── config/
│   │   └── tsconfig/
│   │       ├── base.json
│   │       ├── nextjs.json
│   │       └── react.json
│   │
│   └── ml/                         # ML pipeline: training, eval, export
│       ├── analysis/
│       │   └── gradcam.py
│       ├── data/
│       │   ├── augmentation.py
│       │   ├── dataset.py
│       │   └── preprocessing.py
│       ├── scripts/
│       │   ├── create_label_map.py
│       │   ├── export_model.py
│       │   ├── extract_landmarks.py
│       │   ├── generate_visualizations.py
│       │   ├── prepare_bisindo.py
│       │   ├── train.py
│       │   └── train_mlp.py
│       └── training/
│           ├── callbacks.py
│           ├── metrics.py
│           └── trainer.py
│
├── data/                           # Datasets
│   ├── raw/
│   ├── processed/
│   ├── augmented/
│   └── metadata/
│
├── models/                         # Trained model artifacts
│   ├── checkpoints/
│   ├── exports/
│   ├── production/
│   └── hand_landmarker.task        # MediaPipe hand landmark model
│
├── infrastructure/
│   ├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── nginx/
│   ├── monitoring/
│   └── teraform/
│
├── docs/
├── scripts/
├── analysis_outputs/
├── .github/
├── .gitignore
├── docker-compose.yml
├── signify-architecture.excalidraw
└── README.md
```
