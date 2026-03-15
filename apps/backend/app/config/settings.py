# apps/backend/app/config/settings.py
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────────────────────────
    APP_NAME:    str = "Signify AI — BISINDO Inference API"
    APP_VERSION: str = "1.0.0"
    DEBUG:       bool = False

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    # ── Model ─────────────────────────────────────────────────────────────────
    # Path relatif dari repo root (signify-ai/)
    SAVED_MODEL_PATH: str = "models/exports/bisindo_v1/saved_model"
    LABEL_MAP_PATH:   str = "models/exports/bisindo_v1/label_map.json"

    # SavedModel signature keys — didapat dari export_model.py
    # Cek ulang dengan: python -c "import tf; m=tf.saved_model.load(...); print(m.signatures['serving_default'].structured_input_signature)"
    MODEL_INPUT_KEY:  str = "keras_tensor_154"
    MODEL_OUTPUT_KEY: str = "output_0"

    # ── Inference ─────────────────────────────────────────────────────────────
    INPUT_SIZE: int = 224      # MobileNetV2 input resolution
    TOP_K:      int = 3        # jumlah top prediksi yang dikembalikan

    # Confidence threshold — prediksi di bawah ini dianggap "tidak yakin"
    CONFIDENCE_THRESHOLD: float = 0.5

    class Config:
        env_file = ".env"
        extra    = "ignore"


@lru_cache
def get_settings() -> Settings:
    """Singleton settings — di-cache setelah pertama kali dipanggil."""
    return Settings()