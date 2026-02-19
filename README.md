### **Signify-AI Monorepo Structure**
```
signify-ai/
│
├── .github/
│   ├── workflows/
│   │   ├── ci-frontend.yml
│   │   ├── ci-backend.yml
│   │   ├── ci-ml.yml
│   │   ├── deploy-frontend.yml
│   │   ├── deploy-backend.yml
│   │   └── security-scan.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
│
├── apps/
│   ├── frontend/
│   │   ├── .next/
│   │   ├── public/
│   │   │   ├── icons/
│   │   │   ├── images/
│   │   │   └── locales/
│   │   │       ├── en/
│   │   │       └── id/
│   │   │
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── history/
│   │   │   │   ├── settings/
│   │   │   │   └── translate/
│   │   │   ├── api/
│   │   │   │   └── health/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── ...
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   └── RegisterForm.tsx
│   │   │   │   ├── translation/
│   │   │   │   │   ├── WebcamCapture.tsx
│   │   │   │   │   ├── PredictionDisplay.tsx
│   │   │   │   │   └── TTSControls.tsx
│   │   │   │   └── dashboard/
│   │   │   │       └── HistoryTable.tsx
│   │   │   └── layouts/
│   │   │       ├── AppLayout.tsx
│   │   │       └── AuthLayout.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── client.ts
│   │   │   │   └── endpoints/
│   │   │   │       ├── auth.ts
│   │   │   │       ├── translation.ts
│   │   │   │       └── user.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useWebcam.ts
│   │   │   │   └── useWebSocket.ts
│   │   │   ├── stores/
│   │   │   │   └── authStore.ts
│   │   │   ├── utils/
│   │   │   │   ├── validators.ts
│   │   │   │   └── formatters.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   │
│   │   ├── styles/
│   │   │   └── themes/
│   │   │
│   │   ├── tests/
│   │   │   ├── e2e/
│   │   │   │   └── translation.spec.ts
│   │   │   ├── integration/
│   │   │   └── unit/
│   │   │
│   │   ├── .env.example
│   │   ├── .env.local
│   │   ├── .eslintrc.json
│   │   ├── .prettierrc
│   │   ├── next.config.js
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tailwind.config.ts
│   │
│   └── backend/
│       ├── alembic/
│       │   ├── versions/
│       │   ├── env.py
│       │   └── alembic.ini
│       ├── app/
│       │   ├── __init__.py
│       │   ├── main.py
│       │   ├── config/
│       │   │   ├── __init__.py
│       │   │   ├── settings.py
│       │   │   └── database.py
│       │   ├── api/
│       │   │   ├── __init__.py
│       │   │   ├── deps.py
│       │   │   └── v1/
│       │   │       ├── __init__.py
│       │   │       ├── router.py
│       │   │       └── endpoints/
│       │   │           ├── auth.py
│       │   │           ├── users.py
│       │   │           ├── translation.py
│       │   │           ├── websocket.py
│       │   │           └── health.py
│       │   ├── core/
│       │   │   ├── __init__.py
│       │   │   ├── security.py
│       │   │   ├── exceptions.py
│       │   │   └── middleware.py
│       │   ├── models/
│       │   │   ├── __init__.py
│       │   │   ├── user.py
│       │   │   ├── prediction.py
│       │   │   └── session.py
│       │   ├── schemas/
│       │   │   ├── __init__.py
│       │   │   ├── user.py
│       │   │   ├── auth.py
│       │   │   └── translation.py
│       │   ├── services/
│       │   │   ├── __init__.py
│       │   │   ├── auth_service.py
│       │   │   ├── user_service.py
│       │   │   └── ml_service.py
│       │   ├── repositories/
│       │   │   ├── __init__.py
│       │   │   ├── user_repository.py
│       │   │   └── prediction_repository.py
│       │   └── utils/
│       │       ├── __init__.py
│       │       ├── logger.py
│       │       └── helpers.py
│       ├── tests/
│       │   ├── __init__.py
│       │   ├── conftest.py
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── scripts/
│       │   ├── init_db.py
│       │   └── seed_data.py
│       ├── .env.example
│       ├── .env
│       ├── pyproject.toml
│       ├── poetry.lock
│       ├── requirements.txt
│       ├── Dockerfile
│       └── pytest.ini
│
├── packages/
│   ├── types/
│   │   ├── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ml/
│   │   ├── data/
│   │   │   ├── __init__.py
│   │   │   ├── dataset.py
│   │   │   ├── preprocessing.py
│   │   │   └── augmentation.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── cnn_lstm.py
│   │   │   ├── transformer.py
│   │   │   └── ensemble.py
│   │   ├── training/
│   │   │   ├── __init__.py
│   │   │   ├── trainer.py
│   │   │   ├── callbacks.py
│   │   │   └── metrics.py
│   │   ├── inference/
│   │   │   ├── __init__.py
│   │   │   ├── predictor.py
│   │   │   └── postprocessing.py
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   └── visualization.py
│   │   ├── configs/
│   │   │   ├── base.yaml
│   │   │   ├── cnn_lstm.yaml
│   │   │   └── transformer.yaml
│   │   ├── scripts/
│   │   │   ├── train.py
│   │   │   ├── evaluate.py
│   │   │   └── export.py
│   │   ├── tests/
│   │   ├── pyproject.toml
│   │   └── requirements.txt
│   │
│   └── config/
│       ├── eslint/
│       │   └── index.js
│       └── tsconfig/
│           ├── base.json
│           ├── nextjs.json
│           └── react.json
│
├── data/
│   ├── raw/
│   │   ├── asl_alphabet/
│   │   └── wlasl/
│   ├── processed/
│   │   ├── train/
│   │   ├── val/
│   │   └── test/
│   ├── augmented/
│   └── metadata/
│       ├── class_labels.json
│       └── dataset_stats.json
│
├── models/
│   ├── checkpoints/
│   │   └── model_epoch_50.pth
│   ├── production/
│   │   ├── model_v1.onnx
│   │   └── model_v2.onnx
│   └── experiments/
│       └── wandb/
│
├── infrastructure/
│   ├── docker/
│   │   ├── frontend.Dockerfile
│   │   ├── backend.Dockerfile
│   │   └── ml.Dockerfile
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── kubernetes/
│   │   ├── deployments/
│   │   ├── services/
│   │   └── ingress/
│   ├── terraform/
│   │   ├── main.tf
│   │   └── variables.tf
│   └── monitoring/
│       ├── prometheus/
│       │   └── prometheus.yml
│       └── grafana/
│           └── dashboards/
│
├── docs/
│   ├── api/
│   │   └── openapi.yaml
│   ├── architecture/
│   │   ├── diagrams/
│   │   └── decisions/
│   │       └── 001-tech-stack.md
│   ├── setup/
│   │   ├── development.md
│   │   └── production.md
│   ├── user-guide/
│   └── CONTRIBUTING.md
│
├── scripts/
│   ├── setup-dev.sh
│   ├── migrate-db.sh
│   ├── backup-db.sh
│   └── deploy.sh
│
├── .dvcignore
├── .dvc/
├── .gitignore
├── .gitattributes
├── .editorconfig
├── .prettierrc
├── .eslintrc.js
├── .dockerignore
├── .env.example
├── docker-compose.yml
├── Makefile
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── LICENSE
└── README.md
