# apps/backend/app/config/settings.py
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME:    str  = "Signify AI — BISINDO Inference API"
    APP_VERSION: str  = "1.0.0"
    DEBUG:       bool = False

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
    # When false, unauthenticated requests are allowed (tokens still validated
    # if present, so a forged token is always rejected).
    REQUIRE_AUTH: bool = False

    # Model paths
    SAVED_MODEL_PATH: str = "models/exports/bisindo_v2_ls/saved_model"
    LABEL_MAP_PATH:   str = "models/exports/bisindo_v2_ls/label_map.json"

    # Inference
    INPUT_SIZE:           int   = 224
    TOP_K:                int   = 3
    CONFIDENCE_THRESHOLD: float = 0.55

    class Config:
        env_file = ".env"
        extra    = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()