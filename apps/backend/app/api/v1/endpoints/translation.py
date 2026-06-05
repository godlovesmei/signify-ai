# apps/backend/app/api/v1/endpoints/translation.py
import asyncio
import logging
from typing import Annotated

import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.deps import verify_supabase_token
from app.config.settings import Settings, get_settings
from app.services.ml_service import YOLOService

router = APIRouter(prefix="/translate", tags=["translation"])
logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 2 * 1024 * 1024  # 2 MB


def get_service(settings: Settings = Depends(get_settings)) -> YOLOService:
    return YOLOService.get_instance(settings.MODEL_PATH)


async def run_inference(service: YOLOService, image: np.ndarray, conf: float) -> dict:
    return await asyncio.to_thread(service.predict, image, conf=conf)


@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    service: YOLOService = Depends(get_service),
    settings: Settings = Depends(get_settings),
    _token: Annotated[dict | None, Depends(verify_supabase_token)] = None,
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Format tidak didukung")

    try:
        contents = await file.read(MAX_IMAGE_SIZE + 1)
        if len(contents) > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=413, detail="File terlalu besar")

        arr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=422, detail="Gagal decode gambar")

        try:
            return await asyncio.wait_for(
                run_inference(service, image, settings.CONFIDENCE_THRESHOLD),
                timeout=settings.INFERENCE_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError as exc:
            raise HTTPException(
                status_code=504,
                detail="Inference timeout",
            ) from exc
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="Gambar tidak valid") from exc
        except RuntimeError as exc:
            logger.exception("Inference service unavailable")
            raise HTTPException(
                status_code=503,
                detail="Inference service unavailable",
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected inference failure")
            raise HTTPException(
                status_code=500,
                detail="Internal server error",
            ) from exc
    finally:
        await file.close()


@router.get("/classes")
async def get_classes(service: YOLOService = Depends(get_service)):
    return {
        "classes": service.model.names,
        "total": len(service.model.names),
    }
