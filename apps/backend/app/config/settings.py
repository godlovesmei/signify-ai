# apps/backend/app/config/settings.py
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


_BACKEND_DIR = Path(__file__).resolve().parents[2]
_REPO_ROOT = _BACKEND_DIR.parents[1]
DEFAULT_ENV_FILES = (_REPO_ROOT / ".env", _BACKEND_DIR / ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=DEFAULT_ENV_FILES, extra="ignore")

    # App
    APP_NAME:    str  = "Signify AI — BISINDO Inference API"
    APP_VERSION: str  = "1.0.0"
    APP_DEBUG:   bool = False

    # CORS — comma-separated list of allowed origins.
    # In production, set via env: CORS_ORIGINS=https://yourdomain.com
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    # Supabase — required for JWT validation.
    # Get JWT_SECRET from: Supabase dashboard → Settings → API → JWT Secret
    SUPABASE_URL:        str  = ""
    SUPABASE_JWT_SECRET: str  = ""

    # Auth — set REQUIRE_AUTH=true in production to enforce JWT on /predict.
    # When false, unauthenticated requests are allowed. Tokens are validated
    # only when SUPABASE_JWT_SECRET is configured.
    REQUIRE_AUTH: bool = False

    # Model path
    MODEL_PATH: str = "models/exports/bisindo_yolo/best.pt"

    # Inference
    INPUT_SIZE:           int   = 640
    CONFIDENCE_THRESHOLD: float = 0.5
    INFERENCE_TIMEOUT_SECONDS: float = 5.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
