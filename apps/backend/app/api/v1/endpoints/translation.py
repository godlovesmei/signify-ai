# apps/backend/app/api/v1/endpoints/translation.py
"""
Endpoint untuk inferensi BISINDO sign language.

Routes:
    POST /api/v1/translate/predict   — terima gambar, return prediksi
    GET  /api/v1/translate/classes   — list semua kelas
"""

import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.deps import verify_supabase_token
from app.services.ml_service import MLService, PredictionResult, get_ml_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/translate", tags=["translation"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 1 * 1024 * 1024  # 1 MB


# ── Schemas (inline, tidak butuh Pydantic terpisah untuk sekarang) ─────────────

def _prediction_to_dict(result: PredictionResult) -> dict:
    return {
        "prediction":    result.prediction,
        "confidence":    result.confidence,
        "top_k":         result.top_k,
        "inference_ms":  result.inference_ms,
        "low_confidence": result.low_confidence,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/predict")
async def predict(
    file:    UploadFile = File(...),
    service: MLService  = Depends(get_ml_service),
    _token:  Annotated[dict | None, Depends(verify_supabase_token)] = None,
):
    """
    Terima gambar webcam, kembalikan prediksi huruf BISINDO.

    Request:
        multipart/form-data — field 'file' berisi gambar JPEG/PNG/WebP

    Response:
        {
          "prediction":     "A",
          "confidence":     0.987,
          "top_k":          [{"class": "A", "confidence": 0.987}, ...],
          "inference_ms":   45.2,
          "low_confidence": false
        }

    Jika low_confidence=true, frontend sebaiknya menampilkan UI
    yang menunjukkan model tidak yakin (confidence < threshold konfigurasi).
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipe file tidak didukung: {file.content_type}. Gunakan JPEG/PNG/WebP.",
        )

    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membaca file: {e}")

    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Gambar terlalu besar ({len(image_bytes)} bytes). Maks {MAX_IMAGE_SIZE} bytes.",
        )

    # Run blocking TF inference in a thread pool so it doesn't block the
    # async event loop and stall concurrent requests.
    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, service.predict, image_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        logger.exception("Unexpected inference error")
        raise HTTPException(status_code=500, detail="Internal inference error")

    logger.debug(
        "Prediction: %s (%.3f) in %.1fms",
        result.prediction, result.confidence, result.inference_ms,
    )
    return _prediction_to_dict(result)


@router.get("/classes")
def get_classes(service: MLService = Depends(get_ml_service)):
    """Kembalikan semua kelas yang bisa diprediksi."""
    return {
        "classes": service.label_map,
        "total":   service.num_classes,
    }
