"""Explicit environments; production never reads the local dotenv file."""
import ipaddress
import os
from pathlib import Path
import re
from typing import Literal
from urllib.parse import urlsplit
from pydantic import SecretStr, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND = Path(__file__).resolve().parents[2]
DEVELOPMENT_ENV = BACKEND / ".env.dataset.local"


def validated_origin(value: str, local: bool) -> str:
    try:
        u = urlsplit(value)
        if (value != value.strip() or u.username or u.password or
                u.path not in ("", "/") or u.query or u.fragment):
            raise ValueError()
        if local:
            if u.scheme != "http" or u.hostname != "127.0.0.1" or not u.port:
                raise ValueError()
        else:
            host = u.hostname or ""
            if (u.scheme != "https" or u.port not in (None, 443) or
                    not re.fullmatch(r"[a-z0-9-]+(?:\.[a-z0-9-]+)+", host) or
                    host.endswith((".localhost", ".local", ".internal"))):
                raise ValueError()
            try:
                ipaddress.ip_address(host)
            except ValueError:
                pass
            else:
                raise ValueError()
    except ValueError:
        raise ValueError("Use loopback HTTP in local mode or a public HTTPS origin in production.") from None
    return u.scheme + "://" + u.hostname + ((":" + str(u.port)) if local else "")


class DatasetSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="DATASET_", env_file=DEVELOPMENT_ENV, extra="ignore", hide_input_in_errors=True)
    environment: Literal["local", "production"] = "local"
    supabase_url: str = "http://127.0.0.1:55431"
    allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    anon_key: SecretStr = SecretStr("")
    service_role_key: SecretStr = SecretStr("")
    jwt_hs256_secret: SecretStr = SecretStr("")
    idempotency_secret: SecretStr = SecretStr("")
    work_dir: Path = BACKEND / ".dataset-runtime"
    ffprobe: str = "ffprobe"
    ffmpeg: str = "ffmpeg"
    process_timeout_seconds: int = Field(default=15, ge=1, le=120)
    process_memory_mib: int = Field(default=1024, ge=128, le=2048)
    max_parallel_uploads: int = Field(default=2, ge=1, le=8)
    upstream_timeout_seconds: float = Field(default=10, gt=0, le=60)
    signed_url_seconds: int = Field(default=60, ge=1, le=300)
    playback_max_bytes: int = Field(default=52428800, ge=1048576, le=104857600)
    review_workflow_ready: bool = True
    review_target_business_days: int = Field(default=3, ge=1, le=60)

    @classmethod
    def settings_customise_sources(cls, settings_cls, init_settings, env_settings, dotenv_settings, file_secret_settings):
        mode = init_settings.init_kwargs.get("environment", os.environ.get("DATASET_ENVIRONMENT", "local"))
        if mode == "production":
            return init_settings, env_settings, file_secret_settings
        return init_settings, env_settings, dotenv_settings, file_secret_settings

    @model_validator(mode="after")
    def validate_environment(self):
        production = self.environment == "production"
        self.supabase_url = validated_origin(self.supabase_url, local=not production)
        if not self.allowed_origins:
            raise ValueError("At least one frontend origin is required.")
        if production:
            self.allowed_origins = [validated_origin(origin, local=False) for origin in self.allowed_origins]
            if not self.anon_key.get_secret_value() or not self.service_role_key.get_secret_value():
                raise ValueError("Production Supabase public and server keys are required.")
            if len(self.idempotency_secret.get_secret_value()) < 32:
                raise ValueError("A stable idempotency secret of at least 32 characters is required.")
            if not self.work_dir.is_absolute() or self.work_dir == BACKEND / ".dataset-runtime":
                raise ValueError("Set DATASET_WORK_DIR to an absolute path on persistent storage.")
        elif any(origin not in ("http://localhost:3000", "http://127.0.0.1:3000") for origin in self.allowed_origins):
            raise ValueError("Local CORS origins must use localhost or loopback port 3000.")
        return self

    @property
    def issuer(self) -> str:
        return self.supabase_url + "/auth/v1"
