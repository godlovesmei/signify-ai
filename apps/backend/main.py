# apps/backend/main.py
"""
Entry point FastAPI untuk Signify AI backend.

Jalankan dari repo root (signify-ai/):
    conda activate signify-backend
    uvicorn apps.backend.main:app --host 0.0.0.0 --port 8000 --reload
"""

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.services.ml_service import init_ml_service, get_ml_service
from app.api.v1.endpoints.translation import router as translation_router

logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt = "%Y-%m-%d %H:%M:%S",
)
logger   = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Signify AI backend...")
    try:
        init_ml_service(settings)
        logger.info("Startup complete.")
    except Exception as e:
        logger.error("Failed to load model during startup: %s", e)
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title    = settings.APP_NAME,
    version  = settings.APP_VERSION,
    lifespan = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = settings.cors_origins_list,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

app.include_router(translation_router, prefix="/api/v1")


@app.get("/health", tags=["system"])
def health():
    try:
        svc = get_ml_service()
        return {
            "status":    "ok",
            "model":     settings.SAVED_MODEL_PATH,
            "classes":   svc.num_classes,
            "loaded_at": svc.loaded_at,
        }
    except RuntimeError:
        return {
            "status":  "model_not_loaded",
            "model":   settings.SAVED_MODEL_PATH,
            "classes": 0,
        }