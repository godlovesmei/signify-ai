"""Catalog and local-browser CORS tests; no database writes or policy activation."""
import httpx
import jwt
import pytest
from fastapi.testclient import TestClient
from app.config.dataset_settings import DatasetSettings
from dataset_main import create_app
from test_dataset_api import FakeSupabase, SECRET, UID, LABEL, token


@pytest.fixture
def catalog(tmp_path):
    upstream = FakeSupabase()
    rows = [{"id": LABEL, "code": "synthetic_test", "display_name": "Synthetic unit label", "description": None}]
    requests = []

    def handle(request):
        requests.append(request)
        if request.url.path == "/rest/v1/dataset_labels":
            assert request.method == "GET"
            assert request.url.params["is_active"] == "eq.true"
            assert request.url.params["select"] == "id,code,display_name,description"
            assert jwt.decode(request.headers["Authorization"][7:], SECRET, algorithms=["HS256"], audience="authenticated")["sub"] == UID
            return httpx.Response(200, json=rows)
        return upstream(request)

    settings = DatasetSettings(_env_file=None, anon_key="synthetic-public", service_role_key="synthetic-service",
                               jwt_hs256_secret=SECRET, work_dir=tmp_path)
    with TestClient(create_app(settings, httpx.MockTransport(handle))) as client:
        yield client, rows, requests


def test_catalog_requires_verified_auth(catalog):
    client, _, requests = catalog
    assert client.get("/api/v1/dataset/labels").status_code == 401
    assert not requests


def test_catalog_reads_only_active_public_fields(catalog):
    client, rows, _ = catalog
    response = client.get("/api/v1/dataset/labels", headers={"Authorization": "Bearer " + token()})
    assert response.status_code == 200 and response.json() == {"items": rows}
    assert "created_by" not in response.json()["items"][0]


def test_empty_catalog_does_not_invent_labels(catalog):
    client, rows, _ = catalog
    rows.clear()
    response = client.get("/api/v1/dataset/labels", headers={"Authorization": "Bearer " + token()})
    assert response.status_code == 200 and response.json() == {"items": []}


@pytest.mark.parametrize("origin,allowed", [("http://localhost:3000", True),
                                           ("http://127.0.0.1:3000", False),
                                           ("https://remote.invalid", False)])
def test_cors_only_allows_localhost_development(catalog, origin, allowed):
    client, _, _ = catalog
    response = client.options("/api/v1/contributions", headers={"Origin": origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,idempotency-key,content-type"})
    assert response.status_code == (200 if allowed else 400)
    assert (response.headers.get("access-control-allow-origin") == origin) == allowed
