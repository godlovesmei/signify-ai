# apps/backend/app/services/ml_service.py
"""
ML inference service untuk BISINDO sign language classifier.

Bertanggung jawab untuk:
  - Load dan hold SavedModel di memory
  - Preprocessing gambar dari webcam → format yang diharapkan model
  - Menjalankan inference dan mengembalikan hasil terstruktur

Domain Gap Fix:
  Dataset training (Roboflow) sudah di-grayscale dan di-crop rapi.
  Input dari webcam berupa full frame berwarna dengan background.
  Preprocessing di sini menjembatani gap tersebut:
    1. Convert RGB → Grayscale → RGB  (simulasi kondisi training — dataset Roboflow grayscale)
    2. Resize ke 224×224
    3. Normalize ke [0, 1] sesuai EfficientNetV2B0
"""

import json
import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np
import tensorflow as tf
from PIL import Image
import io

from app.config.settings import Settings

logger = logging.getLogger(__name__)


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class PredictionResult:
    prediction:   str
    confidence:   float
    top_k:        list[dict]   # [{"class": "A", "confidence": 0.99}, ...]
    inference_ms: float
    low_confidence: bool       # True jika confidence < threshold


# ── ML Service ────────────────────────────────────────────────────────────────

class MLService:
    """
    Singleton service yang memegang model di memory.
    Di-instantiate sekali saat startup dan di-inject via FastAPI dependency.
    """

    def __init__(self, settings: Settings):
        self.settings  = settings
        self._infer    = None
        self._label_map: dict[str, str] = {}
        self._loaded   = False
        self._loaded_at: float = 0.0

    # ── Load ──────────────────────────────────────────────────────────────────

    def load(self) -> None:
        """Load model dan label map dari disk ke memory."""
        model_path     = Path(self.settings.SAVED_MODEL_PATH)
        label_map_path = Path(self.settings.LABEL_MAP_PATH)

        if not model_path.exists():
            raise FileNotFoundError(f"SavedModel tidak ditemukan: {model_path}")
        if not label_map_path.exists():
            raise FileNotFoundError(f"Label map tidak ditemukan: {label_map_path}")

        logger.info("Loading model from %s", model_path)
        loaded       = tf.saved_model.load(str(model_path))
        self._infer  = loaded.signatures["serving_default"]

        self._label_map = json.loads(label_map_path.read_text(encoding="utf-8"))
        self._loaded    = True
        self._loaded_at = time.time()

        logger.info("Model loaded successfully. Classes: %d", len(self._label_map))

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def loaded_at(self) -> float:
        return self._loaded_at

    @property
    def num_classes(self) -> int:
        return len(self._label_map)

    @property
    def label_map(self) -> dict[str, str]:
        return self._label_map

    # ── Preprocessing ─────────────────────────────────────────────────────────

    def _preprocess(self, image_bytes: bytes) -> np.ndarray:
        """
        Pipeline preprocessing untuk input webcam → tensor siap inferensi.

        Steps:
          1. Decode bytes → PIL → NumPy RGB uint8
          2. RGB → Grayscale via ITU-R BT.601 luminance weights
             (mencocokkan distribusi training data Roboflow yang sudah grayscale)
          3. Grayscale → 3-channel (stack identik) karena model expect (224,224,3)
          4. Resize ke 224×224 (bilinear, sama dengan tf.image.resize di training)
          5. Normalize [0,255] → [0,1] — model dilatih dengan include_preprocessing=False
             dan pipeline training membagi 255; EfficientNetV2B0 expect [0,1]
          6. Add batch dim → (1, 224, 224, 3)

        Note: CLAHE dihapus — model tidak dilatih dengan CLAHE sehingga
        menerapkannya saat inferensi menghasilkan input di luar distribusi training.

        Returns:
            float32 array shape (1, 224, 224, 3) range [0, 1]
        """
        # Step 1: decode
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        arr   = np.array(image, dtype=np.uint8)   # (H, W, 3)
        logger.debug("[preprocess] decode  — shape=%s dtype=%s min=%d max=%d mean=%.1f",
                     arr.shape, arr.dtype, arr.min(), arr.max(), arr.mean())

        # Step 2: RGB → Grayscale using ITU-R BT.601 luminance weights
        # Explicit weights avoid ambiguity with cv2 BGR/RGB ordering.
        gray = np.dot(arr[..., :3], [0.299, 0.587, 0.114]).astype(np.uint8)  # (H, W)
        logger.debug("[preprocess] gray   — shape=%s dtype=%s min=%d max=%d mean=%.1f",
                     gray.shape, gray.dtype, gray.min(), gray.max(), gray.mean())

        # Step 3: Grayscale → 3-channel RGB (stack identical channels)
        rgb = np.stack([gray, gray, gray], axis=-1)   # (H, W, 3)

        # Step 4: Resize ke target size (bilinear via PIL)
        size = self.settings.INPUT_SIZE
        rgb  = np.array(
            Image.fromarray(rgb).resize((size, size), Image.BILINEAR),
            dtype=np.uint8,
        )
        logger.debug("[preprocess] resize — shape=%s dtype=%s min=%d max=%d mean=%.1f",
                     rgb.shape, rgb.dtype, rgb.min(), rgb.max(), rgb.mean())

        # Step 5: Normalize [0,255] → [0,1]
        arr_f = rgb.astype(np.float32) / 255.0
        logger.debug("[preprocess] norm   — shape=%s dtype=%s min=%.4f max=%.4f mean=%.4f",
                     arr_f.shape, arr_f.dtype, arr_f.min(), arr_f.max(), arr_f.mean())

        # Step 6: Add batch dimension
        batch = np.expand_dims(arr_f, axis=0)   # (1, 224, 224, 3)
        logger.debug("[preprocess] batch  — shape=%s dtype=%s", batch.shape, batch.dtype)
        return batch

    # ── Inference ─────────────────────────────────────────────────────────────

    def predict(self, image_bytes: bytes) -> PredictionResult:
        """
        Jalankan full inference pipeline pada gambar yang diberikan.

        Args:
            image_bytes: raw bytes dari gambar (JPEG/PNG/WebP)

        Returns:
            PredictionResult dengan prediksi, confidence, dan top-K hasil

        Raises:
            RuntimeError: jika model belum di-load
            ValueError:   jika gambar tidak bisa diproses
        """
        if not self._loaded or self._infer is None:
            raise RuntimeError("Model belum di-load. Panggil load() terlebih dahulu.")

        # Preprocessing
        try:
            arr = self._preprocess(image_bytes)
        except Exception as e:
            raise ValueError(f"Gagal memproses gambar: {e}") from e

        # Inference
        t0 = time.perf_counter()
        output_dict = self._infer(
            **{self.settings.MODEL_INPUT_KEY: tf.constant(arr)}
        )
        probs = output_dict[self.settings.MODEL_OUTPUT_KEY][0].numpy()
        t1    = time.perf_counter()

        inference_ms = (t1 - t0) * 1000

        # Full softmax vector for diagnosis — enable DEBUG logging to see this.
        # Look for: confidently wrong (one class >0.8, wrong) → domain shift / flip issue
        #           uncertain (no class >0.3) → preprocessing mismatch
        if logger.isEnabledFor(logging.DEBUG):
            softmax_str = "  ".join(
                f"{self._label_map.get(str(i), '?')}={probs[i]:.4f}"
                for i in range(len(probs))
            )
            logger.debug("[softmax] %s", softmax_str)

        # Top-K results
        top_k_idx     = np.argsort(probs)[::-1][:self.settings.TOP_K]
        top_k_results = [
            {
                "class":      self._label_map[str(idx)],
                "confidence": round(float(probs[idx]), 4),
            }
            for idx in top_k_idx
        ]

        best_class      = top_k_results[0]["class"]
        best_confidence = top_k_results[0]["confidence"]

        return PredictionResult(
            prediction    = best_class,
            confidence    = best_confidence,
            top_k         = top_k_results,
            inference_ms  = round(inference_ms, 2),
            low_confidence = best_confidence < self.settings.CONFIDENCE_THRESHOLD,
        )


# ── Singleton instance ────────────────────────────────────────────────────────
# Di-import oleh main.py untuk lifespan load dan oleh deps.py untuk injection

_ml_service: Optional[MLService] = None


def get_ml_service() -> MLService:
    """FastAPI dependency — inject MLService ke endpoint."""
    if _ml_service is None:
        raise RuntimeError("MLService belum diinisialisasi.")
    return _ml_service


def init_ml_service(settings: Settings) -> MLService:
    """Dipanggil sekali saat app startup di lifespan."""
    global _ml_service
    _ml_service = MLService(settings)
    _ml_service.load()
    return _ml_service