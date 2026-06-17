"""Optional parity smoke test for local `.pt` and browser ONNX artifacts.

This test is intentionally skipped by default. Enable it only on a machine that
has the model artifacts and runtime dependencies available:

    RUN_MODEL_PARITY=1 MODEL_PARITY_IMAGE=/path/to/sample.jpg python -m pytest tests/test_model_parity.py -q
"""

import os
from pathlib import Path

import pytest


pytestmark = pytest.mark.skipif(
    os.getenv("RUN_MODEL_PARITY") != "1",
    reason="Set RUN_MODEL_PARITY=1 to run local `.pt` vs ONNX parity checks.",
)


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _resolve_sample_image(root: Path) -> Path:
    configured = os.getenv("MODEL_PARITY_IMAGE")
    if configured:
        return Path(configured)

    for pattern in (
        "apps/frontend/public/alfabet/*.jpg",
        "data/bisindo/images/**/*.jpg",
    ):
        match = next(root.glob(pattern), None)
        if match is not None:
            return match

    pytest.skip("No parity image found; set MODEL_PARITY_IMAGE=/path/to/sample.jpg.")


def _iou(a: list[float], b: list[float]) -> float:
    left = max(a[0], b[0])
    top = max(a[1], b[1])
    right = min(a[2], b[2])
    bottom = min(a[3], b[3])
    intersection = max(0.0, right - left) * max(0.0, bottom - top)
    if intersection == 0:
        return 0.0

    area_a = max(0.0, a[2] - a[0]) * max(0.0, a[3] - a[1])
    area_b = max(0.0, b[2] - b[0]) * max(0.0, b[3] - b[1])
    return intersection / (area_a + area_b - intersection)


def _top_detection(model, image_path: Path):
    result = model(str(image_path), conf=0.25, verbose=False)[0]
    boxes = list(result.boxes)
    if not boxes:
        return None

    box = max(boxes, key=lambda item: float(item.conf[0]))
    return {
        "class_index": int(box.cls[0]),
        "confidence": float(box.conf[0]),
        "box": [float(value) for value in box.xyxy[0]],
    }


def test_tc_027_pt_and_onnx_top_detection_parity():
    root = _repo_root()
    pt_path = root / "models/exports/bisindo_yolo/best.pt"
    onnx_path = root / "apps/frontend/public/models/bisindo-yolo11n/v1/best.onnx"
    if not pt_path.exists():
        pytest.skip(f"Missing local `.pt` model: {pt_path}")
    if not onnx_path.exists():
        pytest.skip(f"Missing browser ONNX artifact: {onnx_path}")

    try:
        from ultralytics import YOLO
    except ModuleNotFoundError as exc:
        pytest.skip(f"Ultralytics is not installed: {exc}")

    sample_image = _resolve_sample_image(root)
    pt_detection = _top_detection(YOLO(str(pt_path)), sample_image)
    onnx_detection = _top_detection(YOLO(str(onnx_path)), sample_image)

    assert pt_detection is not None
    assert onnx_detection is not None
    assert onnx_detection["class_index"] == pt_detection["class_index"]
    assert _iou(onnx_detection["box"], pt_detection["box"]) >= 0.5
