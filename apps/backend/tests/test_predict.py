"""
Integration tests for POST /api/v1/translate/predict.

Uses a mocked MLService (no real TF model needed).
"""

import io

from PIL import Image


def _make_png_bytes(width: int = 224, height: int = 224) -> bytes:
    """Create a minimal valid PNG image in memory."""
    img = Image.new("RGB", (width, height), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _make_jpeg_bytes(width: int = 224, height: int = 224) -> bytes:
    img = Image.new("RGB", (width, height), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# ── Happy path ────────────────────────────────────────────────────────────────

class TestPredictHappyPath:
    def test_png_returns_prediction(self, client, mock_ml_service):
        resp = client.post(
            "/api/v1/translate/predict",
            files={"file": ("hand.png", _make_png_bytes(), "image/png")},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["prediction"] == "A"
        assert body["confidence"] == 0.95
        assert body["low_confidence"] is False
        assert len(body["top_k"]) == 3
        assert isinstance(body["inference_ms"], float)
        mock_ml_service.predict.assert_called_once()

    def test_jpeg_accepted(self, client):
        resp = client.post(
            "/api/v1/translate/predict",
            files={"file": ("hand.jpg", _make_jpeg_bytes(), "image/jpeg")},
        )
        assert resp.status_code == 200

    def test_webp_accepted(self, client):
        # WebP content-type is allowed; send a PNG (server decodes via PIL anyway)
        resp = client.post(
            "/api/v1/translate/predict",
            files={"file": ("hand.webp", _make_png_bytes(), "image/webp")},
        )
        assert resp.status_code == 200


# ── Validation errors ─────────────────────────────────────────────────────────

class TestPredictValidation:
    def test_unsupported_content_type_returns_400(self, client):
        resp = client.post(
            "/api/v1/translate/predict",
            files={"file": ("hand.gif", b"GIF89a", "image/gif")},
        )
        assert resp.status_code == 400
        assert "tidak didukung" in resp.json()["detail"]

    def test_oversized_image_returns_413(self, client):
        # 2 MB of zeros — exceeds the 1 MB limit
        big = b"\x00" * (2 * 1024 * 1024)
        resp = client.post(
            "/api/v1/translate/predict",
            files={"file": ("big.png", big, "image/png")},
        )
        assert resp.status_code == 413

    def test_missing_file_returns_422(self, client):
        resp = client.post("/api/v1/translate/predict")
        assert resp.status_code == 422


# ── Service error propagation ────────────────────────────────────────────────

class TestPredictErrorHandling:
    def test_value_error_returns_422(self, client, mock_ml_service):
        mock_ml_service.predict.side_effect = ValueError("bad image")
        resp = client.post(
            "/api/v1/translate/predict",
            files={"file": ("hand.png", _make_png_bytes(), "image/png")},
        )
        assert resp.status_code == 422
        assert "bad image" in resp.json()["detail"]

    def test_runtime_error_returns_503(self, client, mock_ml_service):
        mock_ml_service.predict.side_effect = RuntimeError("model not loaded")
        resp = client.post(
            "/api/v1/translate/predict",
            files={"file": ("hand.png", _make_png_bytes(), "image/png")},
        )
        assert resp.status_code == 503

    def test_unexpected_error_returns_500(self, client, mock_ml_service):
        mock_ml_service.predict.side_effect = Exception("boom")
        resp = client.post(
            "/api/v1/translate/predict",
            files={"file": ("hand.png", _make_png_bytes(), "image/png")},
        )
        assert resp.status_code == 500


# ── Health endpoint ──────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_200(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] in ("ok", "model_not_loaded")


# ── Classes endpoint ─────────────────────────────────────────────────────────

class TestClasses:
    def test_classes_returns_label_map(self, client):
        resp = client.get("/api/v1/translate/classes")
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 3
        assert "0" in body["classes"]
