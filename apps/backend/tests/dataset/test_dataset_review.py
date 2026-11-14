"""Local review controls, mandatory explanations, and size feedback; mocked DB."""
import json
from uuid import uuid4
import httpx
import jwt
import pytest
from fastapi.testclient import TestClient
from app.config.dataset_settings import DatasetSettings
from dataset_main import create_app
from test_dataset_api import FakeSupabase, SECRET, UID, OTHER, LABEL, POLICY_ROW, TECHNICAL, token, setup, upload


def test_empty_file_has_specific_feedback_and_creates_no_contribution(setup):
    client, _, upstream, _ = setup
    response = upload(client, value=b"")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "empty_video"
    assert response.json()["error"]["details"] == {"size_bytes": 0, "max_size_bytes": POLICY_ROW["max_size_bytes"]}
    assert not upstream.rows and not upstream.objects


def test_oversized_file_reports_exact_file_size_not_multipart_size(setup):
    client, _, upstream, _ = setup
    size = POLICY_ROW["max_size_bytes"] + 40000
    response = upload(client, value=b"x" * size)
    assert response.status_code == 413
    assert response.json()["error"]["details"] == {"size_bytes": size, "max_size_bytes": POLICY_ROW["max_size_bytes"]}
    assert not upstream.rows and not upstream.objects


def test_multipart_limit_reports_limit_without_claiming_request_size_is_video_size(setup):
    client, _, upstream, _ = setup
    response = upload(client, value=b"x" * (POLICY_ROW["max_size_bytes"] + 70000))
    assert response.status_code == 413
    assert response.json()["error"]["details"] == {"max_size_bytes": POLICY_ROW["max_size_bytes"]}
    assert not upstream.rows and not upstream.objects


def test_nonempty_files_have_no_invented_kilobyte_minimum(setup):
    client, _, _, _ = setup
    # The inspector is mocked in this fixture. Real decoding remains separately
    # required and covered by the real-media tests, even for nonempty files.
    assert upload(client, value=b"x").status_code == 201


@pytest.fixture
def review(tmp_path):
    upstream = FakeSupabase()
    cid = str(uuid4())
    row = {"id": cid, "user_id": OTHER, "status": "PENDING", "revision": 1,
           "rejection_reason": None, "proposed_label_id": LABEL, **TECHNICAL}
    writes, reads = [], []
    state = {"forbidden": False, "timeout": False, "curator": True, "available": True}
    settings = DatasetSettings(_env_file=None, anon_key="synthetic-public", service_role_key="synthetic-service",
        jwt_hs256_secret=SECRET, work_dir=tmp_path, review_workflow_ready=True)

    def handle(request):
        if request.url.path == "/rest/v1/rpc/dataset_access_info":
            return httpx.Response(200, json={"is_admin": False, "is_curator": state["curator"], "review_available": state["available"]})
        if request.url.path == "/rest/v1/rpc/dataset_review_contribution":
            writes.append(request)
            assert request.method == "POST"
            assert request.headers["apikey"] == "synthetic-public"
            assert jwt.decode(request.headers["Authorization"][7:], SECRET, algorithms=["HS256"], audience="authenticated")["sub"] == UID
            if state["forbidden"]:
                return httpx.Response(403, json={"code": "42501", "message": "private DB message"})
            if state["timeout"]:
                raise httpx.ReadTimeout("synthetic timeout", request=request)
            body = json.loads(request.read())
            if body["p_expected_revision"] != row["revision"]:
                return httpx.Response(500, json={"code": "40001", "message": "Contribution revision changed"})
            row.update(status=body["p_decision"], rejection_reason=body["p_reason"], revision=row["revision"] + 1)
            return httpx.Response(200, json={"contribution_id": cid, "review_id": str(uuid4()),
                                           "status": row["status"], "revision": row["revision"]})
        if request.url.path == "/rest/v1/dataset_contributions":
            reads.append(request)
            assert request.headers["apikey"] == "synthetic-public"
            assert request.headers["Authorization"] == "Bearer " + token_value
            return httpx.Response(200, json=[row], headers={"Content-Range": "*/1"})
        return upstream(request)

    token_value = token()
    with TestClient(create_app(settings, httpx.MockTransport(handle))) as client:
        yield client, settings, row, writes, reads, state, {"Authorization": "Bearer " + token_value}


def test_review_info_is_authenticated_and_hides_inactive_internal_target(review):
    client, settings, _, _, _, state, headers = review
    assert client.get("/api/v1/dataset/review-info").status_code == 401
    settings.review_workflow_ready = False
    assert client.get("/api/v1/dataset/review-info", headers=headers).json() == {
        "available": False, "target_business_days": None, "can_review": False}
    settings.review_workflow_ready = True
    state["available"] = False
    assert client.get("/api/v1/dataset/review-info", headers=headers).json()["available"] is False


def test_review_info_reports_conditional_target_and_no_curator_ids(review):
    client, settings, _, _, _, _, headers = review
    settings.review_target_business_days = 5
    assert client.get("/api/v1/dataset/review-info", headers=headers).json() == {
        "available": True, "target_business_days": 5, "can_review": True}


def test_review_queue_uses_caller_jwt_pending_filter_and_stable_pagination(review):
    client, _, _, _, reads, _, headers = review
    response = client.get("/api/v1/dataset/review-queue?limit=10&offset=20", headers=headers)
    assert response.status_code == 200
    params = reads[0].url.params
    assert params["status"] == "eq.PENDING" and params["deleted_at"] == "is.null"
    assert params["order"] == "created_at.desc,id.desc" and params["limit"] == "11" and params["offset"] == "20"


@pytest.mark.parametrize("reason", [None, "", "   ", "\n\t", "\u00a0"])
def test_rejection_requires_nonblank_reason_before_rpc(review, reason):
    client, _, row, writes, _, _, headers = review
    body = {"expected_revision": 1, "decision": "REJECTED", "reason": reason}
    response = client.post("/api/v1/dataset/reviews/" + row["id"], headers=headers, json=body)
    assert response.status_code == 422 and response.json()["error"]["code"] == "invalid_review"
    assert not writes and row["status"] == "PENDING"


def test_rejection_sends_trimmed_reason_and_current_revision_to_atomic_rpc(review):
    client, _, row, writes, _, _, headers = review
    response = client.post("/api/v1/dataset/reviews/" + row["id"], headers=headers,
        json={"expected_revision": 1, "decision": "REJECTED", "reason": "  Keep both hands inside the frame.  "})
    assert response.status_code == 200 and response.json()["revision"] == 2
    assert json.loads(writes[0].read()) == {"p_contribution_id": row["id"], "p_expected_revision": 1,
        "p_decision": "REJECTED", "p_final_label_id": None, "p_reason": "Keep both hands inside the frame."}
    assert row["rejection_reason"] == "Keep both hands inside the frame."


def test_stale_review_is_not_retried_and_cannot_overwrite_decision(review):
    client, _, row, writes, _, _, headers = review
    body = {"expected_revision": 1, "decision": "REJECTED", "reason": "Incomplete gesture"}
    url = "/api/v1/dataset/reviews/" + row["id"]
    assert client.post(url, headers=headers, json=body).status_code == 200
    response = client.post(url, headers=headers, json={**body, "reason": "Stale reason"})
    assert response.status_code == 409 and len(writes) == 2
    assert row["rejection_reason"] == "Incomplete gesture"


def test_access_check_never_overrides_atomic_database_curator_authorization(review):
    client, _, row, writes, _, state, headers = review
    state["forbidden"] = True
    response = client.post("/api/v1/dataset/reviews/" + row["id"], headers=headers,
        json={"expected_revision": 1, "decision": "REJECTED", "reason": "Needs clearer movement"})
    assert response.status_code == 403 and len(writes) == 1
    assert row["status"] == "PENDING" and "private DB message" not in response.text


def test_inactive_workflow_and_unassigned_users_cannot_read_queue_or_review(review):
    client, settings, row, writes, reads, state, headers = review
    settings.review_workflow_ready = False
    assert client.get("/api/v1/dataset/review-queue", headers=headers).status_code == 503
    settings.review_workflow_ready = True
    state["curator"] = False
    assert client.get("/api/v1/dataset/review-queue", headers=headers).status_code == 403
    assert client.post("/api/v1/dataset/reviews/" + row["id"], headers=headers,
        json={"expected_revision": 1, "decision": "REJECTED", "reason": "No access"}).status_code == 403
    assert not reads and not writes


def test_uncertain_review_does_not_auto_retry(review):
    client, _, row, writes, _, state, headers = review
    state["timeout"] = True
    response = client.post("/api/v1/dataset/reviews/" + row["id"], headers=headers,
        json={"expected_revision": 1, "decision": "REJECTED", "reason": "Incomplete gesture"})
    assert response.status_code == 503 and response.json()["error"]["code"] == "review_commit_unknown"
    assert len(writes) == 1


def test_approval_requires_explicit_final_label_and_rejection_forbids_it(review):
    client, _, row, writes, _, _, headers = review
    url = "/api/v1/dataset/reviews/" + row["id"]
    assert client.post(url, headers=headers, json={"expected_revision": 1, "decision": "APPROVED"}).status_code == 422
    assert client.post(url, headers=headers, json={"expected_revision": 1, "decision": "REJECTED",
        "reason": "Unclear gesture", "final_label_id": LABEL}).status_code == 422
    assert not writes
    assert client.post(url, headers=headers, json={"expected_revision": 1, "decision": "APPROVED",
        "final_label_id": LABEL}).status_code == 200
    assert json.loads(writes[0].read())["p_final_label_id"] == LABEL


def test_new_word_approval_sends_label_text_atomically(review):
    client, _, row, writes, _, _, headers = review
    response = client.post("/api/v1/dataset/reviews/" + row["id"], headers=headers,
        json={"expected_revision": 1, "decision": "APPROVED", "final_label_text": "  New word  "})
    assert response.status_code == 200
    assert json.loads(writes[0].read())["p_final_label_text"] == "New word"


@pytest.mark.parametrize("body", [
    {"decision": "APPROVED", "final_label_text": "   "},
    {"decision": "APPROVED", "final_label_id": LABEL, "final_label_text": "Word"},
    {"decision": "REJECTED", "reason": "Invalid gesture", "final_label_text": "Word"},
])
def test_conflicting_final_labels_are_rejected_before_rpc(review, body):
    client, _, row, writes, _, _, headers = review
    response = client.post("/api/v1/dataset/reviews/" + row["id"], headers=headers,
                           json={"expected_revision": 1, **body})
    assert response.status_code == 422 and not writes
