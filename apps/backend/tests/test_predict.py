"""Route contract tests for the current YOLO-backed translation API."""

import asyncio
import io

import pytest
from fastapi import HTTPException
from PIL import Image

from app.api.v1.endpoints import translation
from app.api.v1.endpoints.translation import MAX_IMAGE_SIZE, get_classes, predict
from app.services.ml_service import YOLOService


def _image_bytes(format_name: str = "PNG") -> bytes:
    image = Image.new("RGB", (16, 16), color=(128, 128, 128))
    buffer = io.BytesIO()
    image.save(buffer, format=format_name)
    return buffer.getvalue()


class MemoryUpload:
    def __init__(self, data: bytes, mime: str, name: str):
        self.data = data
        self.content_type = mime
        self.filename = name
        self.read_size = None
        self.closed = False

    async def read(self, size: int = -1):
        self.read_size = size
        return self.data if size < 0 else self.data[:size]

    async def close(self):
        self.closed = True


def _upload(data: bytes, mime: str = "image/png", name: str = "hand.png"):
    return MemoryUpload(data, mime, name)


def _predict(file, service, settings):
    return asyncio.run(
        predict(file=file, service=service, settings=settings, _token=None)
    )


@pytest.fixture(autouse=True)
def direct_inference(monkeypatch):
    async def run(service, image, conf):
        return service.predict(image, conf=conf)

    monkeypatch.setattr(translation, "run_inference", run)


class TestPredictContract:
    def test_tc_007_valid_png_returns_current_detection_contract(
        self, mock_ml_service, settings_override
    ):
        file = _upload(_image_bytes())
        result = _predict(
            file,
            mock_ml_service,
            settings_override,
        )

        assert result == mock_ml_service.predict.return_value
        assert file.read_size == MAX_IMAGE_SIZE + 1
        assert file.closed is True
        image = mock_ml_service.predict.call_args.args[0]
        assert image.shape == (16, 16, 3)

    def test_tc_007_jpeg_and_webp_are_accepted(
        self, mock_ml_service, settings_override
    ):
        for extension, format_name, mime in (
            ("jpg", "JPEG", "image/jpeg"),
            ("webp", "WEBP", "image/webp"),
        ):
            result = _predict(
                _upload(_image_bytes(format_name), mime, f"hand.{extension}"),
                mock_ml_service,
                settings_override,
            )
            assert result["model"] == "best.pt"

    @pytest.mark.parametrize(
        ("file", "status_code"),
        [
            (_upload(b"GIF89a", "image/gif", "hand.gif"), 400),
            (_upload(b"x" * (MAX_IMAGE_SIZE + 1)), 413),
            (_upload(b"not-an-image"), 422),
        ],
    )
    def test_tc_008_rejects_invalid_oversized_and_corrupt_files(
        self, file, status_code, mock_ml_service, settings_override
    ):
        with pytest.raises(HTTPException) as exc:
            _predict(file, mock_ml_service, settings_override)
        assert exc.value.status_code == status_code

    def test_tc_008_openapi_requires_the_primary_image_form_field(self):
        from main import app

        operation = app.openapi()["paths"]["/api/v1/translate/predict"]["post"]
        assert operation["requestBody"]["required"] is True

    @pytest.mark.parametrize(
        ("error", "status_code", "detail"),
        [
            (ValueError("sensitive decoder detail"), 422, "Gambar tidak valid"),
            (
                RuntimeError("sensitive model detail"),
                503,
                "Inference service unavailable",
            ),
            (Exception("sensitive stack detail"), 500, "Internal server error"),
        ],
    )
    def test_tc_022_returns_generic_safe_service_errors(
        self,
        error,
        status_code,
        detail,
        mock_ml_service,
        settings_override,
    ):
        mock_ml_service.predict.side_effect = error
        with pytest.raises(HTTPException) as exc:
            _predict(_upload(_image_bytes()), mock_ml_service, settings_override)
        assert exc.value.status_code == status_code
        assert exc.value.detail == detail

    def test_tc_022_returns_504_when_inference_exceeds_timeout(
        self, mock_ml_service, settings_override, monkeypatch
    ):
        settings_override.INFERENCE_TIMEOUT_SECONDS = 0.01

        async def slow_inference(*_args, **_kwargs):
            await asyncio.sleep(0.05)
            return {"detections": []}

        monkeypatch.setattr(translation, "run_inference", slow_inference)
        with pytest.raises(HTTPException) as exc:
            _predict(_upload(_image_bytes()), mock_ml_service, settings_override)
        assert exc.value.status_code == 504
        assert exc.value.detail == "Inference timeout"


class TestSystemEndpoints:
    def test_tc_022_health_and_classes_return_current_contract(self, mock_ml_service):
        from main import health

        previous = YOLOService._instance
        YOLOService._instance = mock_ml_service
        try:
            health_result = asyncio.run(health())
            classes_result = asyncio.run(get_classes(service=mock_ml_service))
        finally:
            YOLOService._instance = previous

        assert health_result["status"] == "ok"
        assert health_result["classes"] == 3
        assert classes_result == {
            "classes": {0: "A", 1: "B", 2: "C"},
            "total": 3,
        }
