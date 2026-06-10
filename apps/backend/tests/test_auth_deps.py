"""
Unit tests for auth dependency behavior in app.api.deps.verify_supabase_token.
"""

import asyncio
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

from app.api.deps import verify_supabase_token
from app.config.settings import Settings


def _settings(require_auth: bool, secret: str = "") -> Settings:
    return Settings(
        APP_DEBUG=False,
        REQUIRE_AUTH=require_auth,
        SUPABASE_JWT_SECRET=secret,
    )


def _bearer(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def _verify(credentials, settings):
    return asyncio.run(
        verify_supabase_token(credentials=credentials, settings=settings)
    )


class TestVerifySupabaseToken:
    def test_tc_009_anonymous_allowed_when_auth_not_required(self):
        payload = _verify(credentials=None, settings=_settings(require_auth=False))
        assert payload is None

    def test_tc_009_missing_token_rejected_when_auth_required(self):
        with pytest.raises(HTTPException) as exc:
            _verify(credentials=None, settings=_settings(require_auth=True))

        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED

    def test_tc_023_token_is_ignored_when_auth_optional_and_secret_missing(self):
        token = "header.payload.signature"
        payload = _verify(
            credentials=_bearer(token),
            settings=_settings(require_auth=False, secret=""),
        )

        assert payload is None

    def test_tc_023_token_fails_closed_if_auth_required_and_secret_missing(self):
        token = "header.payload.signature"
        with pytest.raises(HTTPException) as exc:
            _verify(
                credentials=_bearer(token),
                settings=_settings(require_auth=True, secret=""),
            )

        assert exc.value.status_code == status.HTTP_503_SERVICE_UNAVAILABLE

    def test_tc_009_valid_token_returns_payload(self):
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

        payload = _verify(
            credentials=_bearer(token),
            settings=_settings(require_auth=True, secret=secret),
        )

        assert payload is not None
        assert payload["sub"] == "user-123"
        assert payload["aud"] == "authenticated"

    def test_tc_009_invalid_token_rejected(self):
        with pytest.raises(HTTPException) as exc:
            _verify(
                credentials=_bearer("invalid.token.here"),
                settings=_settings(require_auth=True, secret="test-secret"),
            )

        assert exc.value.status_code == status.HTTP_403_FORBIDDEN

    def test_tc_009_expired_token_is_rejected_as_unauthorized(self):
        secret = "test-secret"
        token = jwt.encode(
            {
                "sub": "user-123",
                "aud": "authenticated",
                "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
            },
            secret,
            algorithm="HS256",
        )

        with pytest.raises(HTTPException) as exc:
            _verify(
                credentials=_bearer(token),
                settings=_settings(require_auth=True, secret=secret),
            )
        assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED
