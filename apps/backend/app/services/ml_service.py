# apps/backend/app/services/ml_service.py
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


@dataclass
class PredictionResult:
    prediction:    str
    confidence:    float
    top_k:         list[dict]
    inference_ms:  float
    low_confidence: bool


class MLService:
    def __init__(self, settings: Settings):
        self.settings     = settings
        self._infer       = None
        self._input_key:  str = ""
        self._output_key: str = ""
        self._label_map: dict[str, str] = {}
        self._loaded      = False
        self._loaded_at: float = 0.0

    def load(self) -> None:
        model_path     = Path(self.settings.SAVED_MODEL_PATH)
        label_map_path = Path(self.settings.LABEL_MAP_PATH)

        logger.info("Loading model from %s", model_path)

        if not model_path.exists():
            raise FileNotFoundError(
                f"SavedModel tidak ditemukan: {model_path}\n"
                "Generate/export model dulu:\n"
                "python packages/ml/scripts/export_model.py "
                "--checkpoint models/checkpoints/bisindo_v2_ls/phase2_best.weights.h5 "
                "--output_dir models/exports/bisindo_v2_ls"
            )
        if not label_map_path.exists():
            raise FileNotFoundError(f"Label map tidak ditemukan: {label_map_path}")

        loaded       = tf.saved_model.load(str(model_path))
        self._infer  = loaded.signatures["serving_default"]

        input_keys  = list(self._infer.structured_input_signature[1].keys())
        output_keys = list(self._infer.structured_outputs.keys())
        self._input_key  = input_keys[0]
        self._output_key = output_keys[0]
        logger.info("Signature keys — input: %s, output: %s", self._input_key, self._output_key)

        self._label_map = json.loads(label_map_path.read_text(encoding="utf-8"))
        if not self._label_map:
            raise RuntimeError("Label map kosong.")

        expected_keys = {str(i) for i in range(len(self._label_map))}
        actual_keys   = set(self._label_map.keys())
        if expected_keys != actual_keys:
            missing = sorted(expected_keys - actual_keys)
            extra   = sorted(actual_keys - expected_keys)
            raise RuntimeError(
                f"Label map index mismatch. Missing={missing}, Extra={extra}"
            )

        output_spec = self._infer.structured_outputs[self._output_key]
        output_dim  = output_spec.shape[-1]
        if output_dim is not None and int(output_dim) != len(self._label_map):
            raise RuntimeError(
                f"Jumlah kelas model != label_map: "
                f"model={int(output_dim)} vs label_map={len(self._label_map)}"
            )

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

    def _preprocess(self, image_bytes: bytes) -> np.ndarray:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        arr   = np.array(image, dtype=np.uint8)
        logger.debug("[preprocess] decode  — shape=%s dtype=%s min=%d max=%d mean=%.1f",
                     arr.shape, arr.dtype, arr.min(), arr.max(), arr.mean())

        gray = np.dot(arr[..., :3], [0.299, 0.587, 0.114]).astype(np.uint8)
        logger.debug("[preprocess] gray    — shape=%s dtype=%s min=%d max=%d mean=%.1f",
                     gray.shape, gray.dtype, gray.min(), gray.max(), gray.mean())

        rgb = np.stack([gray, gray, gray], axis=-1)

        size = self.settings.INPUT_SIZE
        rgb_tensor = tf.image.resize(
            rgb[np.newaxis].astype(np.float32),
            [size, size],
            method=tf.image.ResizeMethod.BILINEAR,
            antialias=False,
        )[0].numpy()
        rgb = np.clip(rgb_tensor, 0.0, 255.0).astype(np.uint8)
        logger.debug("[preprocess] resize  — shape=%s dtype=%s min=%d max=%d mean=%.1f",
                     rgb.shape, rgb.dtype, rgb.min(), rgb.max(), rgb.mean())

        arr_f = rgb.astype(np.float32) / 255.0
        logger.debug("[preprocess] norm    — shape=%s dtype=%s min=%.4f max=%.4f mean=%.4f",
                     arr_f.shape, arr_f.dtype, arr_f.min(), arr_f.max(), arr_f.mean())

        batch = np.expand_dims(arr_f, axis=0)
        logger.debug("[preprocess] batch   — shape=%s dtype=%s", batch.shape, batch.dtype)
        return batch

    def predict(self, image_bytes: bytes) -> PredictionResult:
        if not self._loaded or self._infer is None:
            raise RuntimeError("Model belum di-load. Panggil load() terlebih dahulu.")

        try:
            arr = self._preprocess(image_bytes)
        except Exception as e:
            raise ValueError(f"Gagal memproses gambar: {e}") from e

        t0 = time.perf_counter()
        output_dict = self._infer(**{self._input_key: tf.constant(arr)})
        probs = output_dict[self._output_key][0].numpy()
        t1    = time.perf_counter()

        inference_ms = (t1 - t0) * 1000

        if logger.isEnabledFor(logging.DEBUG):
            softmax_str = "  ".join(
                f"{self._label_map.get(str(i), '?')}={probs[i]:.4f}"
                for i in range(len(probs))
            )
            logger.debug("[softmax] %s", softmax_str)

        top_k_idx     = np.argsort(probs)[::-1][:self.settings.TOP_K]
        top_k_results = [
            {
                "class":      self._label_map[str(idx)],
                "confidence": round(float(probs[idx]), 4),
            }
            for idx in top_k_idx
        ]

        best_idx             = int(top_k_idx[0])
        best_class           = self._label_map[str(best_idx)]
        best_confidence_raw  = float(probs[best_idx])
        best_confidence_disp = round(best_confidence_raw, 4)

        return PredictionResult(
            prediction     = best_class,
            confidence     = best_confidence_disp,
            top_k          = top_k_results,
            inference_ms   = round(inference_ms, 2),
            low_confidence = best_confidence_raw < self.settings.CONFIDENCE_THRESHOLD,
        )


_ml_service: Optional[MLService] = None


def get_ml_service() -> MLService:
    if _ml_service is None:
        raise RuntimeError("MLService belum diinisialisasi.")
    return _ml_service


def init_ml_service(settings: Settings) -> MLService:
    global _ml_service
    _ml_service = MLService(settings)
    _ml_service.load()
    return _ml_service
