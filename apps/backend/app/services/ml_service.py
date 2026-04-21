# apps/backend/app/services/ml_service.py
from pathlib import Path
import time

import numpy as np
from ultralytics import YOLO


class YOLOService:
    _instance: "YOLOService | None" = None

    def __init__(self, model_path: str):
        self.model = YOLO(model_path)
        self.model_path = model_path
        self.loaded_at = time.time()

        # Warmup once so first real request has lower latency.
        dummy = np.zeros((640, 640, 3), dtype=np.uint8)
        self.model(dummy, verbose=False)

    @classmethod
    def get_instance(cls, model_path: str) -> "YOLOService":
        if cls._instance is None:
            cls._instance = cls(model_path)
        return cls._instance

    def predict(self, image: np.ndarray, conf: float = 0.5) -> dict:
        start = time.perf_counter()
        results = self.model(image, conf=conf, verbose=False)[0]
        elapsed_ms = (time.perf_counter() - start) * 1000

        detections: list[dict] = []
        for box in results.boxes:
            cls_idx = int(box.cls[0])
            names = self.model.names
            label = names.get(cls_idx, str(cls_idx)) if isinstance(names, dict) else names[cls_idx]

            coords = box.xyxy[0]
            detections.append(
                {
                    "class": label,
                    "confidence": float(box.conf[0]),
                    "box": {
                        "x1": float(coords[0]),
                        "y1": float(coords[1]),
                        "x2": float(coords[2]),
                        "y2": float(coords[3]),
                    },
                }
            )

        return {
            "detections": detections,
            "inference_ms": round(elapsed_ms, 2),
            "model": Path(self.model_path).name,
        }
