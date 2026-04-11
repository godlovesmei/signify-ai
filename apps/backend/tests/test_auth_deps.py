"""
Unit tests for auth dependency behavior in app.api.deps.verify_supabase_token.
"""

from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

from app.api.deps import verify_supabase_token
from app.config.settings import Settings


def _settings(require_auth: bool, secret: str = "") -> Settings:
    return Settings(
        REQUIRE_AUTH=require_auth,
        SUPABASE_JWT_SECRET=secret,
    )


def _bearer(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


class TestVerifySupabaseToken:
    def test_anonymous_allowed_when_auth_not_required(self):
        payload = verify_supabase_token(credentials=None, settings=_settings(require_auth=False))
        assert payload is None

    def test_missing_token_rejected_when_auth_required(self):
        with pytest.raises(HTTPException) as exc:
            verify_supabase_token(credentials=None, settings=_settings(require_auth=True))

        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

    def test_token_skips_validation_if_secret_not_configured(self):
        token = "header.payload.signature"
        payload = verify_supabase_token(
            credentials=_bearer(token),
            settings=_settings(require_auth=False, secret=""),
        )
        assert payload is None

    def test_valid_token_returns_payload(self):
        secret = "test-secret"
        token = jwt.encode(
            {
                "sub": "user-123",
                "aud": "authenticated",
                "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
            },
            secret,
            algorithm="HS256",
        )

        payload = verify_supabase_token(
            credentials=_bearer(token),
            settings=_settings(require_auth=True, secret=secret),
        )

        assert payload is not None
        assert payload["sub"] == "user-123"
        assert payload["aud"] == "authenticated"

    def test_invalid_token_rejected(self):
        with pytest.raises(HTTPException) as exc:
            verify_supabase_token(
                credentials=_bearer("invalid.token.here"),
                settings=_settings(require_auth=True, secret="test-secret"),
            )

        assert exc.value.status_code == status.HTTP_403_FORBIDDEN
