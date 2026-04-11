"""
Shared fixtures for backend tests.

Uses a mock MLService so tests don't need the actual TF model on disk.
"""

import sys
from contextlib import asynccontextmanager
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

# Ensure app package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.ml_service import MLService, PredictionResult, get_ml_service
from app.config.settings import Settings, get_settings


def _make_fake_result(**overrides) -> PredictionResult:
    defaults = dict(
        prediction="A",
        confidence=0.95,
        top_k=[
            {"class": "A", "confidence": 0.95},
            {"class": "B", "confidence": 0.03},
            {"class": "C", "confidence": 0.02},
        ],
        inference_ms=12.3,
        low_confidence=False,
    )
    defaults.update(overrides)
    return PredictionResult(**defaults)


@pytest.fixture()
def mock_ml_service():
    svc = MagicMock(spec=MLService)
    svc.predict.return_value = _make_fake_result()
    svc.label_map = {"0": "A", "1": "B", "2": "C"}
    svc.num_classes = 3
    svc.loaded_at = 1000000.0
    svc.is_loaded = True
    return svc


@pytest.fixture()
def settings_override():
    return Settings(
        REQUIRE_AUTH=False,
        SUPABASE_JWT_SECRET="",
        INFERENCE_TIMEOUT_SECONDS=5.0,
    )


@pytest.fixture()
def client(mock_ml_service, settings_override):
    from main import app

    # Replace the lifespan so it doesn't try to load the real model
    @asynccontextmanager
    async def _test_lifespan(app):
        yield

    app.router.lifespan_context = _test_lifespan
    app.dependency_overrides[get_ml_service] = lambda: mock_ml_service
    app.dependency_overrides[get_settings] = lambda: settings_override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
