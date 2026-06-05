"""Shared backend fixtures that keep model execution hermetic."""

import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

# Ensure app package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config.settings import Settings
from app.services.ml_service import YOLOService


def _make_fake_result() -> dict:
    return {
        "detections": [
            {
                "class": "A",
                "confidence": 0.95,
                "box": {"x1": 1.0, "y1": 2.0, "x2": 3.0, "y2": 4.0},
            }
        ],
        "inference_ms": 12.3,
        "model": "best.pt",
    }


@pytest.fixture()
def mock_ml_service():
    svc = MagicMock()
    svc.predict.return_value = _make_fake_result()
    svc.model = SimpleNamespace(names={0: "A", 1: "B", 2: "C"})
    svc.loaded_at = 1000000.0
    return svc


@pytest.fixture()
def settings_override():
    return Settings(
        APP_DEBUG=False,
        REQUIRE_AUTH=False,
        SUPABASE_JWT_SECRET="",
        INFERENCE_TIMEOUT_SECONDS=5.0,
    )
