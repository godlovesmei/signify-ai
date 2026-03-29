# apps/backend/app/api/deps.py
"""
FastAPI dependencies yang dipakai bersama antar endpoint.
"""

import logging
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config.settings import Settings, get_settings

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)


def verify_supabase_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    settings:    Annotated[Settings, Depends(get_settings)],
) -> dict | None:
    """
    Validasi Supabase JWT dari Authorization: Bearer <token>.

    - Jika REQUIRE_AUTH=True  → token wajib ada dan valid (401/403 jika tidak).
    - Jika REQUIRE_AUTH=False → tanpa token diizinkan; token yang ada tetap
      divalidasi sehingga token palsu selalu ditolak.

    Return: payload JWT jika terautentikasi, None jika anonim diizinkan.
    """
    token = credentials.credentials if credentials else None

    # Tidak ada token
    if token is None:
        if settings.REQUIRE_AUTH:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return None

    # Ada token — selalu validasi meski REQUIRE_AUTH=False
    if not settings.SUPABASE_JWT_SECRET:
        logger.warning(
            "Token diterima tapi SUPABASE_JWT_SECRET belum dikonfigurasi — melewati validasi."
        )
        return None

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_exp": True},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sudah kedaluwarsa.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token tidak valid.",
        )
