"""Unit tests for YOLO result mapping without loading a real model."""

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import numpy as np

from app.services.ml_service import YOLOService


def _box(class_index: int = 1):
    return SimpleNamespace(
        cls=np.array([class_index]),
        conf=np.array([0.875]),
        xyxy=np.array([[1.0, 2.0, 30.0, 40.0]]),
    )


def test_tc_007_yolo_service_maps_model_output_to_api_contract():
    model = MagicMock()
    model.names = {0: "A", 1: "B"}
    model.side_effect = [
        [SimpleNamespace(boxes=[])],
        [SimpleNamespace(boxes=[_box()])],
    ]

    with patch("app.services.ml_service.YOLO", return_value=model):
        service = YOLOService("/models/best.pt")
        result = service.predict(np.zeros((16, 16, 3), dtype=np.uint8), conf=0.7)

    assert result["model"] == "best.pt"
    assert result["detections"] == [
        {
            "class": "B",
            "confidence": 0.875,
            "box": {"x1": 1.0, "y1": 2.0, "x2": 30.0, "y2": 40.0},
        }
    ]
    assert model.call_count == 2
    prediction_call = model.call_args_list[1]
    assert np.array_equal(
        prediction_call.args[0], np.zeros((16, 16, 3), dtype=np.uint8)
    )
    assert prediction_call.kwargs == {"conf": 0.7, "verbose": False}


def test_tc_022_yolo_service_singleton_reuses_loaded_model():
    previous = YOLOService._instance
    YOLOService._instance = None
    with patch("app.services.ml_service.YOLO") as model:
        first = YOLOService.get_instance("/models/best.pt")
        second = YOLOService.get_instance("/models/other.pt")
    YOLOService._instance = previous

    assert first is second
    model.assert_called_once_with("/models/best.pt")
