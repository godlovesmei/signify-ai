# apps/backend/main.py
"""
FastAPI backend untuk inferensi BISINDO sign language classifier.

Endpoint:
    POST /predict        → terima gambar, kembalikan prediksi kelas
    GET  /health         → cek status server + model loaded
    GET  /classes        → list semua kelas yang bisa diprediksi

Jalankan:
    uvicorn apps.backend.main:app --host 0.0.0.0 --port 8000 --reload

Atau dari folder apps/backend/:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import json
import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt = "%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────

# Path relatif dari repo root signify-ai/
SAVED_MODEL_PATH = Path("models/exports/bisindo_v1/saved_model")
LABEL_MAP_PATH   = Path("models/exports/bisindo_v1/label_map.json")

INPUT_SIZE       = (224, 224)
TOP_K            = 3   # kembalikan top-3 prediksi


# ── Model state (dimuat saat startup) ─────────────────────────────────────────

class ModelState:
    model:       tf.saved_model = None  # type: ignore
    label_map:   dict           = {}    # {"0": "A", "1": "B", ...}
    loaded:      bool           = False
    loaded_at:   float          = 0.0


state = ModelState()


# ── Lifespan (load model saat startup) ────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model dan label map saat server start."""
    logger.info("Loading model from %s", SAVED_MODEL_PATH)
    try:
        state.model     = tf.saved_model.load(str(SAVED_MODEL_PATH))
        state.label_map = json.loads(LABEL_MAP_PATH.read_text(encoding="utf-8"))
        state.loaded    = True
        state.loaded_at = time.time()
        logger.info("Model loaded. Classes: %d", len(state.label_map))
    except Exception as e:
        logger.error("Gagal load model: %s", e)
        # Server tetap jalan tapi /predict akan return 503
    yield
    logger.info("Server shutting down")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title       = "Signify AI — BISINDO Inference API",
    description = "Sign language recognition untuk alfabet BISINDO",
    version     = "1.0.0",
    lifespan    = lifespan,
)

# CORS — izinkan request dari Next.js frontend (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins     = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ── Preprocessing ─────────────────────────────────────────────────────────────

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Preprocessing gambar dari bytes (upload dari frontend):
      1. Decode bytes → PIL Image
      2. Convert ke RGB (grayscale webcam tetap jadi 3ch)
      3. Resize ke 224×224
      4. Normalize [0,255] → [-1,1]  (sesuai MobileNetV2)
      5. Add batch dimension → shape (1, 224, 224, 3)
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize(INPUT_SIZE, Image.BILINEAR)
    arr   = np.array(image, dtype=np.float32)
    arr   = (arr / 127.5) - 1.0          # [0,255] → [-1,1]
    arr   = np.expand_dims(arr, axis=0)  # (224,224,3) → (1,224,224,3)
    return arr


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Cek status server dan model."""
    return {
        "status":     "ok" if state.loaded else "model_not_loaded",
        "model":      str(SAVED_MODEL_PATH),
        "classes":    len(state.label_map),
        "loaded_at":  state.loaded_at,
    }


@app.get("/classes")
def get_classes():
    """Kembalikan semua kelas yang bisa diprediksi."""
    if not state.loaded:
        raise HTTPException(status_code=503, detail="Model belum loaded")
    return {
        "classes": {idx: name for idx, name in state.label_map.items()},
        "total":   len(state.label_map),
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Terima gambar (JPEG/PNG), kembalikan top-K prediksi kelas.

    Request:
        multipart/form-data dengan field 'file' berisi gambar

    Response:
        {
          "prediction": "A",
          "confidence": 0.987,
          "top_k": [
            {"class": "A", "confidence": 0.987},
            {"class": "B", "confidence": 0.008},
            {"class": "C", "confidence": 0.003}
          ],
          "inference_ms": 12.5
        }
    """
    if not state.loaded:
        raise HTTPException(status_code=503, detail="Model belum loaded")

    # Validasi tipe file
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=400,
            detail=f"Tipe file tidak didukung: {file.content_type}. Gunakan JPEG/PNG/WebP",
        )

    try:
        image_bytes = await file.read()
        arr         = preprocess_image(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal memproses gambar: {e}")

    # Inference
    t0     = time.perf_counter()
    output = state.model(arr, training=False)   # shape: (1, num_classes)
    t1     = time.perf_counter()

    probs        = output[0].numpy()             # shape: (num_classes,)
    top_k_idx    = np.argsort(probs)[::-1][:TOP_K]
    inference_ms = (t1 - t0) * 1000

    top_k_results = [
        {
            "class":      state.label_map[str(idx)],
            "confidence": round(float(probs[idx]), 4),
        }
        for idx in top_k_idx
    ]

    return {
        "prediction":    top_k_results[0]["class"],
        "confidence":    top_k_results[0]["confidence"],
        "top_k":         top_k_results,
        "inference_ms":  round(inference_ms, 2),
    }