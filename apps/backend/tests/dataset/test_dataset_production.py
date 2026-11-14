"""Hosted config/auth/CORS tests; all upstream requests are mocked."""
import json
import time
from uuid import uuid4
import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from app.config.dataset_settings import DatasetSettings
from app.services.dataset_gateway import DatasetGateway
from dataset_main import create_app

SUPABASE = "https://project.supabase.co"
FRONTEND = "https://signify.example.com"


def production(tmp_path, **changes):
    values = dict(_env_file=None, environment="production", supabase_url=SUPABASE,
                  allowed_origins=[FRONTEND], anon_key="sb_publishable_synthetic",
                  service_role_key="sb_secret_synthetic", idempotency_secret="synthetic-idempotency-secret-at-least-32",
                  work_dir=tmp_path)
    values.update(changes)
    return DatasetSettings(**values)


@pytest.mark.parametrize("url", [
    "http://127.0.0.1:55431", "http://project.supabase.co",
    "https://localhost", "https://127.0.0.1", "https://[::1]",
    "https://project.local", "https://project.internal",
    "https://secret@project.supabase.co", SUPABASE + "/rest/v1",
    SUPABASE + "?token=secret", SUPABASE + "#fragment",
])
def test_production_rejects_local_or_ambiguous_origins(tmp_path, url):
    with pytest.raises(ValueError):
        production(tmp_path, supabase_url=url)


@pytest.mark.parametrize("changes", [
    {"allowed_origins": []}, {"allowed_origins": ["*"]},
    {"allowed_origins": ["http://localhost:3000"]},
    {"anon_key": ""}, {"service_role_key": ""}, {"idempotency_secret": "short"},
])
def test_production_requires_explicit_configuration(tmp_path, changes):
    with pytest.raises(ValueError):
        production(tmp_path, **changes)


def test_production_ignores_local_dotenv_even_when_explicitly_passed(tmp_path):
    dotenv = tmp_path / "local.env"
    dotenv.write_text("DATASET_SUPABASE_URL=http://127.0.0.1:55431\nDATASET_JWT_HS256_SECRET=must-not-leak\n")
    settings = production(tmp_path, _env_file=dotenv)
    assert settings.supabase_url == SUPABASE
    assert settings.jwt_hs256_secret.get_secret_value() == ""
    assert "sb_secret_synthetic" not in repr(settings)
    assert settings.issuer == SUPABASE + "/auth/v1"


def test_opaque_keys_are_not_sent_as_bearer_tokens(tmp_path):
    gateway = DatasetGateway(production(tmp_path))
    try:
        assert gateway.headers() == {"apikey": "sb_publishable_synthetic"}
        assert gateway.headers(service=True) == {"apikey": "sb_secret_synthetic"}
        assert gateway.headers("user-jwt") == {
            "apikey": "sb_publishable_synthetic", "Authorization": "Bearer user-jwt",
        }
    finally:
        gateway.close()


def test_hosted_jwks_auth_and_cors_use_configured_origins_only(tmp_path):
    uid = str(uuid4())
    private_key = ec.generate_private_key(ec.SECP256R1())
    jwk = json.loads(jwt.algorithms.ECAlgorithm.to_jwk(private_key.public_key()))
    jwk.update({"kid": "synthetic-key", "alg": "ES256", "use": "sig"})
    seen = []

    def handle(request):
        assert str(request.url).startswith(SUPABASE + "/")
        assert request.headers["apikey"] == "sb_publishable_synthetic"
        seen.append(request.url.path)
        if request.url.path.endswith("/jwks.json"):
            assert "Authorization" not in request.headers
            return httpx.Response(200, json={"keys": [jwk]})
        assert request.headers["Authorization"].startswith("Bearer ")
        if request.url.path == "/auth/v1/user":
            return httpx.Response(200, json={"id": uid})
        if request.url.path == "/rest/v1/dataset_labels":
            return httpx.Response(200, json=[])
        raise AssertionError("Unexpected hosted request")

    claims = {"sub": uid, "role": "authenticated", "aud": "authenticated",
              "iss": SUPABASE + "/auth/v1", "exp": int(time.time()) + 300}
    signed = jwt.encode(claims, private_key, algorithm="ES256", headers={
        "kid": "synthetic-key", "jku": "https://untrusted.example/keys",
    })
    with TestClient(create_app(production(tmp_path), httpx.MockTransport(handle))) as client:
        assert client.get("/health").json()["local_only"] is False
        response = client.get("/api/v1/dataset/labels", headers={"Authorization": "Bearer " + signed})
        assert response.status_code == 200 and response.json() == {"items": []}
        for origin, status in [(FRONTEND, 200), ("http://localhost:3000", 400), ("https://untrusted.example", 400)]:
            response = client.options("/api/v1/contributions", headers={
                "Origin": origin, "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,idempotency-key,content-type",
            })
            assert response.status_code == status
            assert response.headers.get("access-control-allow-origin") == (origin if status == 200 else None)
        requests_before = list(seen)
        wrong_issuer = jwt.encode({**claims, "iss": "http://127.0.0.1:55431/auth/v1"},
                                 private_key, algorithm="ES256", headers={"kid": "synthetic-key"})
        assert client.get("/api/v1/dataset/labels", headers={"Authorization": "Bearer " + wrong_issuer}).status_code == 401
        assert seen == requests_before
    assert seen == ["/auth/v1/.well-known/jwks.json", "/auth/v1/user", "/rest/v1/dataset_labels"]


def test_hosted_origins_are_canonical_for_jwt_issuer_and_cors(tmp_path):
    settings = production(tmp_path, supabase_url="https://PROJECT.supabase.co:443/",
                          allowed_origins=["https://Signify.example.com:443/"])
    assert settings.issuer == SUPABASE + "/auth/v1"
    assert settings.allowed_origins == [FRONTEND]
