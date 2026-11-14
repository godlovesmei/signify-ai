"""Owner-scoped collection reads and free-word proposals; no live database."""
import json
import httpx
import jwt
import pytest
from fastapi.testclient import TestClient
from app.config.dataset_settings import DatasetSettings
from dataset_main import create_app
from test_dataset_api import FakeSupabase, SECRET, UID, LABEL, token, setup, upload


@pytest.fixture
def collection(tmp_path):
    upstream = FakeSupabase()
    reads = []
    counts = {"PENDING": 12, "APPROVED": 7, "REJECTED": 2}
    state = {"fail": False, "range": None, "rows": [], "total": 21}

    def handle(request):
        if request.url.path == "/rest/v1/dataset_labels":
            reads.append(request)
            return httpx.Response(200, json=[{"id": LABEL}])
        if request.url.path == "/rest/v1/dataset_contributions":
            reads.append(request)
            claims = jwt.decode(request.headers["Authorization"][7:], SECRET, algorithms=["HS256"], audience="authenticated")
            assert claims["sub"] == UID
            assert request.headers["apikey"] == "synthetic-public"
            assert request.url.params["user_id"] == "eq." + UID
            assert request.url.params["deleted_at"] == "is.null"
            if state["fail"]:
                return httpx.Response(503, json={})
            if request.method == "HEAD":
                assert request.headers["Prefer"] == "count=exact"
                status = request.url.params["status"][3:]
                return httpx.Response(200, headers={"Content-Range": state["range"] or "*/" + str(counts[status])})
            assert request.method == "GET"
            assert request.headers["Prefer"] == "count=exact"
            return httpx.Response(200, json=state["rows"], headers={"Content-Range": state["range"] or "*/" + str(state["total"])})
        return upstream(request)

    settings = DatasetSettings(_env_file=None, anon_key="synthetic-public", service_role_key="synthetic-service",
                               jwt_hs256_secret=SECRET, work_dir=tmp_path)
    with TestClient(create_app(settings, httpx.MockTransport(handle))) as client:
        yield client, reads, state


def test_summary_requires_real_auth_gate(collection):
    client, reads, _ = collection
    assert client.get("/api/v1/contributions/summary").status_code == 401
    assert not reads


def test_summary_reads_all_statuses_with_owner_jwt_not_service_role(collection):
    client, reads, _ = collection
    response = client.get("/api/v1/contributions/summary", headers={"Authorization": "Bearer " + token()})
    assert response.status_code == 200
    assert response.json() == {"total": 21, "PENDING": 12, "APPROVED": 7, "REJECTED": 2}
    assert len(reads) == 3 and all(r.method == "HEAD" for r in reads)


@pytest.mark.parametrize("content_range", ["*/*", "missing", "*/-1", "*/invalid"])
def test_summary_refuses_unknown_counts_instead_of_showing_zero(collection, content_range):
    client, _, state = collection
    state["range"] = content_range
    assert client.get("/api/v1/contributions/summary", headers={"Authorization": "Bearer " + token()}).status_code == 503


def test_summary_upstream_failure_is_not_an_empty_collection(collection):
    client, _, state = collection
    state["fail"] = True
    assert client.get("/api/v1/contributions/summary", headers={"Authorization": "Bearer " + token()}).status_code == 503


@pytest.mark.parametrize("status", ["PENDING", "APPROVED", "REJECTED"])
def test_collection_filters_keep_ownership_and_pagination(collection, status):
    client, reads, _ = collection
    response = client.get("/api/v1/contributions", params={"status": status, "limit": 10, "offset": 20},
                          headers={"Authorization": "Bearer " + token()})
    assert response.status_code == 200 and response.json() == {"items": [], "next_offset": None, "total": 21}
    query = dict(reads[-1].url.params)
    assert query["status"] == "eq." + status and query["limit"] == "11" and query["offset"] == "20"
    assert query["order"] == "created_at.desc,id.desc"


def test_search_quotes_postgrest_grammar_and_never_replaces_owner_filter(collection):
    client, reads, _ = collection
    term = 'test"),user_id.neq.other,(proposed_label_text.eq."'
    response = client.get("/api/v1/contributions", params={"q": term}, headers={"Authorization": "Bearer " + token()})
    assert response.status_code == 200
    query = dict(reads[-1].url.params)
    assert query["user_id"] == "eq." + UID
    expected = "proposed_label_text.ilike." + json.dumps("*" + term + "*")
    assert query["or"] == "(" + expected + ",proposed_label_id.in.(" + LABEL + "),final_label_id.in.(" + LABEL + "))"


@pytest.mark.parametrize("params", [{"status": "DRAFT"}, {"q": "x" * 161}, {"offset": -1}])
def test_invalid_collection_filters_fail_validation(collection, params):
    client, reads, _ = collection
    assert client.get("/api/v1/contributions", params=params, headers={"Authorization": "Bearer " + token()}).status_code == 422
    assert not reads


def test_free_word_proposal_stays_pending_and_does_not_create_a_label(setup):
    client, _, upstream, _ = setup
    response = upload(client, meta={"proposed_label_text": "  Synthetic word proposal  ",
                                    "consent": True, "consent_version": "synthetic-consent-v1"})
    assert response.status_code == 201
    row = response.json()["contribution"]
    assert row["proposed_label_text"] == "Synthetic word proposal" and row["proposed_label_id"] is None
    assert row["status"] == "PENDING" and row["final_label_id"] is None
    assert all(method == "GET" for method, path in upstream.requests if path.endswith("/dataset_labels"))


def test_free_word_retry_keeps_identity_and_rejects_changed_proposal(setup):
    client, _, upstream, _ = setup
    metadata = {"proposed_label_text": "Synthetic proposal", "consent": True, "consent_version": "synthetic-consent-v1"}
    first = upload(client, meta=metadata)
    retry = upload(client, meta=metadata)
    changed = upload(client, meta={**metadata, "proposed_label_text": "Changed proposal"})
    assert first.status_code == 201 and retry.status_code == 200 and changed.status_code == 409
    assert retry.json()["replayed"] is True
    assert len(upstream.rows) == 1 and len(upstream.objects) == 1


def test_collection_returns_ten_items_and_filtered_total(collection):
    client, reads, state = collection
    state["rows"] = [{"id": str(index)} for index in range(11)]
    state["total"] = 24
    response = client.get("/api/v1/contributions", params={"q": "word", "status": "PENDING"},
                          headers={"Authorization": "Bearer " + token()})
    assert response.status_code == 200
    page = response.json()
    assert len(page["items"]) == 10
    assert page["next_offset"] == 10 and page["total"] == 24
    query = dict(reads[-1].url.params)
    assert query["limit"] == "11" and query["offset"] == "0"
    assert query["status"] == "eq.PENDING" and "word" in query["or"]


@pytest.mark.parametrize("content_range", ["*/*", "missing", "*/-1", "*/invalid"])
def test_collection_refuses_unknown_page_counts(collection, content_range):
    client, _, state = collection
    state["range"] = content_range
    assert client.get("/api/v1/contributions", headers={"Authorization": "Bearer " + token()}).status_code == 503
