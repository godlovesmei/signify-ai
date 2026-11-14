"""Verified Supabase identity using its configured issuer and signing keys."""
from dataclasses import dataclass, field
from uuid import UUID
import threading
import time
import jwt
from app.services.dataset_errors import DatasetError


@dataclass(frozen=True)
class DatasetActor:
    id: UUID
    token: str = field(repr=False)


class DatasetAuth:
    def __init__(self, gateway):
        self.gateway = gateway
        self.keys, self.fetched = [], 0.0
        self.lock = threading.Lock()

    def authenticate(self, header):
        if not header or not header.startswith("Bearer ") or len(header) > 16384:
            raise DatasetError(401, "authentication_required", "Token pengguna yang valid wajib disertakan.")
        token = header[7:].strip()
        try:
            h = jwt.get_unverified_header(token)
            alg = h.get("alg")
            if alg == "HS256":
                key = self.gateway.settings.jwt_hs256_secret.get_secret_value()
                if not key:
                    raise DatasetError(503, "auth_key_unavailable", "Kunci verifikasi token belum tersedia.")
            elif alg in ("ES256", "RS256"):
                kid = h.get("kid")
                if not isinstance(kid, str) or len(kid) > 200:
                    raise jwt.InvalidTokenError()
                with self.lock:
                    now = time.monotonic()
                    if not self.keys or now - self.fetched > 60:
                        result = self.gateway.request("GET", "/auth/v1/.well-known/jwks.json").json()
                        self.keys = result.get("keys", [])
                        self.fetched = now
                    found = next((k for k in self.keys if k.get("kid") == kid and k.get("alg") == alg
                                  and k.get("kty") == ("EC" if alg == "ES256" else "RSA")
                                  and k.get("use", "sig") == "sig"), None)
                    if found is None:
                        raise jwt.InvalidTokenError()
                    # Never accept oct keys/public-key bytes as the shared HS secret.
                    key = jwt.PyJWK.from_dict(found, algorithm=alg).key
            else:
                raise jwt.InvalidTokenError()
            payload = jwt.decode(token, key, algorithms=[alg], audience="authenticated",
                                 issuer=self.gateway.settings.issuer,
                                 options={"require": ["exp", "iss", "aud", "sub"]})
            uid = UUID(payload["sub"])
            if payload.get("role") != "authenticated":
                raise jwt.InvalidTokenError()
        except (jwt.InvalidTokenError, ValueError, TypeError, KeyError):
            raise DatasetError(401, "invalid_token", "Token pengguna tidak valid atau kedaluwarsa.") from None
        try:
            user = self.gateway.request("GET", "/auth/v1/user", token=token).json()
        except DatasetError as error:
            if error.status == 403:
                raise DatasetError(401, "invalid_session", "Sesi pengguna tidak valid.") from None
            raise
        if user.get("id") != str(uid):
            raise DatasetError(401, "invalid_session", "Identitas sesi pengguna tidak sesuai.")
        return DatasetActor(uid, token)
