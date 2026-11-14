import shutil
"""Opt-in real local Supabase tests; creates only uniquely marked synthetic data."""
import importlib.util
import json
import os
from pathlib import Path
import secrets
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient
from app.config.dataset_settings import DatasetSettings
from app.services.dataset_errors import DatasetError
from dataset_main import create_app

pytestmark = pytest.mark.skipif(os.getenv("SIGNIFY_DATASET_LIVE_TESTS") != "1",
                                reason="Opt in to synthetic local Supabase integration fixtures")
FFMPEG = os.environ.get("DATASET_TEST_FFMPEG") or shutil.which("ffmpeg") or "ffmpeg"
FFPROBE = str(Path(FFMPEG).with_name("ffprobe"))


@pytest.fixture(scope="module")
def live(tmp_path_factory):
    repo = Path(__file__).resolve().parents[4]
    spec = importlib.util.spec_from_file_location("local_supabase_fixture",
                                                repo / "supabase/tests/integration/test_auth_storage_local.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    stack = module.LocalSuite(Path("/home/bunga/signify-supabase-local"))
    stack.preflight()
    stack.create_accounts()
    settings = DatasetSettings(_env_file=None, anon_key=stack.anon, service_role_key=stack.service,
                               jwt_hs256_secret=stack.jwt_secret, idempotency_secret=secrets.token_hex(32),
                               work_dir=tmp_path_factory.mktemp("local-dataset-operations"),
                               ffmpeg=FFMPEG, ffprobe=FFPROBE)
    app = create_app(settings)
    try:
        with TestClient(app) as client:
            # The isolated stack is expected to have no real pilot policy at this stage.
            active = stack.sql("select count(*) from public.dataset_video_policies where is_active;")
            if active == "0":
                response = client.post("/api/v1/contributions",
                                       headers={"Authorization": "Bearer " + stack.actors["contributor_a"]["token"]})
                assert response.status_code == 503
                assert response.json()["error"]["code"] == "video_policy_unavailable"
            stack.seed_data()
            yield client, app, stack
    finally:
        stack.cleanup()


def headers(stack, actor="contributor_a", key=None):
    result = {"Authorization": "Bearer " + stack.actors[actor]["token"]}
    if key:
        result["Idempotency-Key"] = key
    return result


def send(client, stack, key, *, actor="contributor_a", data=None, meta=None):
    meta = meta or {"proposed_label_id": stack.labels[0], "consent": True,
                    "consent_version": "backend-synthetic-consent-" + stack.run_id}
    return client.post("/api/v1/contributions", headers=headers(stack, actor, key),
                       files={"file": ("../../untrusted.txt", stack.video if data is None else data,
                                       "application/octet-stream")}, data={"metadata": json.dumps(meta)})


def test_local_real_upload_and_idempotent_retry(live):
    client, _, stack = live
    key = "live-idempotency-" + stack.run_id
    first, second = send(client, stack, key), send(client, stack, key)
    assert first.status_code == 201
    assert second.status_code == 200
    row = first.json()["contribution"]
    assert row["id"] == second.json()["contribution"]["id"] and second.json()["replayed"]
    assert row["user_id"] == stack.actors["contributor_a"]["id"] and row["status"] == "PENDING"
    assert row["source_sha256"] == stack.video_hash
    assert row["mime_type"] == "video/x-msvideo" and row["duration_ms"] == 200
    assert row["width"] == 64 and row["height"] == 48 and row["fps"] == 10
    cid = row["id"]
    counts = stack.sql_json("select json_build_object('candidates',(select count(*) from public.dataset_contributions where id='"
                            + cid + "'),'objects',(select count(*) from storage.objects where bucket_id='dataset-contribution-videos' "
                            "and name='" + row["user_id"] + "/" + cid + "/video'));")
    assert counts == {"candidates": 1, "objects": 1}


def test_local_collection_and_other_owner_denied(live):
    client, _, stack = live
    created = send(client, stack, "live-owner-check-" + stack.run_id)
    assert created.status_code == 201
    cid = created.json()["contribution"]["id"]
    assert client.get("/api/v1/contributions/" + cid, headers=headers(stack)).status_code == 200
    assert client.get("/api/v1/contributions/" + cid,
                      headers=headers(stack, "contributor_b")).status_code == 404
    listed = client.get("/api/v1/contributions", headers=headers(stack, "contributor_b"))
    assert listed.status_code == 200
    assert all(item["user_id"] == stack.actors["contributor_b"]["id"] for item in listed.json()["items"])
    assert cid not in [item["id"] for item in listed.json()["items"]]
    assert client.post("/api/v1/contributions/" + cid + "/video-access",
                       headers=headers(stack, "contributor_b")).status_code == 404


def test_local_private_video_owner_and_granted_curator(live):
    client, _, stack = live
    created = send(client, stack, "live-video-access-" + stack.run_id)
    assert created.status_code == 201
    cid = created.json()["contribution"]["id"]
    for actor in ("contributor_a", "curator_a"):
        response = client.post("/api/v1/contributions/" + cid + "/video-access", headers=headers(stack, actor))
        assert response.status_code == 200
        # Signed URL value is deliberately never printed or persisted.
        import hashlib
        with stack.opener.open(response.json()["url"], timeout=10) as video:
            assert hashlib.sha256(video.read()).hexdigest() == stack.video_hash
    assert client.post("/api/v1/contributions/" + cid + "/video-access",
                       headers=headers(stack, "technical_admin")).status_code == 404


def test_local_invalid_video_and_forged_owner_rejected(live):
    client, _, stack = live
    corrupt = send(client, stack, "live-corrupt-" + stack.run_id, data=b"not a valid video")
    assert corrupt.status_code == 422
    meta = {"proposed_label_id": stack.labels[0], "consent": True, "consent_version": "synthetic",
            "user_id": stack.actors["contributor_b"]["id"]}
    forged = send(client, stack, "live-forged-owner-" + stack.run_id, meta=meta)
    assert forged.status_code == 422


def test_local_invalid_and_expired_tokens(live):
    client, _, stack = live
    import jwt
    import time
    original = stack.actors["contributor_a"]["token"]
    claims = jwt.decode(original, options={"verify_signature": False})
    claims["exp"] = int(time.time()) - 60
    expired = jwt.encode(claims, stack.jwt_secret, algorithm="HS256")
    for authorization in (None, "Bearer invalid-token", "Bearer " + expired):
        response = client.get("/api/v1/contributions",
                              headers={} if authorization is None else {"Authorization": authorization})
        assert response.status_code == 401
    assert client.get("/api/v1/contributions", headers=headers(stack)).status_code == 200


def test_local_stale_rpc_classified_as_409(live):
    _, app, stack = live
    gateway = app.state.dataset_gateway
    body = {"p_contribution_id": stack.contributions["http_race"]["id"], "p_expected_revision": 1,
            "p_decision": "APPROVED", "p_final_label_id": stack.labels[0]}
    path = "/rest/v1/rpc/dataset_review_contribution"
    first = gateway.request("POST", path, token=stack.actors["curator_a"]["token"],
                            operation="dataset_review_contribution", json=body)
    assert first.status_code == 200
    with pytest.raises(DatasetError) as exc:
        gateway.request("POST", path, token=stack.actors["curator_b"]["token"],
                        operation="dataset_review_contribution", json=body)
    assert exc.value.status == 409 and exc.value.code == "candidate_revision_conflict"
    cid = stack.contributions["http_race"]["id"]
    assert stack.sql("select count(*) from public.dataset_curation_reviews where contribution_id='" + cid + "';") == "1"


def test_local_orphan_object_not_exposed_without_candidate(live):
    client, _, stack = live
    from app.services.dataset_gateway import BUCKET
    cid = str(uuid4())
    path = stack.actors["contributor_a"]["id"] + "/" + cid + "/video"
    try:
        response = stack.request("POST", "/storage/v1/object/" + BUCKET + "/" + path, stack.service,
                                 binary=stack.video, content_type="video/x-msvideo")
        assert response["status"] == 200
        denied = stack.request("GET", "/storage/v1/object/" + BUCKET + "/" + path,
                               stack.actors["contributor_a"]["token"])
        assert denied["status"] == 400
        assert client.post("/api/v1/contributions/" + cid + "/video-access",
                           headers=headers(stack)).status_code == 404
    finally:
        deleted = stack.request("DELETE", "/storage/v1/object/" + BUCKET, stack.service, {"prefixes": [path]})
        assert deleted["status"] == 200


def test_local_launcher_health_without_yolo_checkpoint():
    import socket
    import subprocess
    import sys
    import time
    import urllib.request
    repo = Path(__file__).resolve().parents[4]
    with socket.socket() as reserved:
        reserved.bind(("127.0.0.1", 0))
        port = reserved.getsockname()[1]
    command = [sys.executable, str(repo / "apps/backend/scripts/run_dataset_local.py"),
               "--port", str(port), "--ffmpeg", FFMPEG, "--ffprobe", FFPROBE]
    process = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                               stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        ready = False
        for _ in range(60):
            if process.poll() is not None:
                break
            try:
                with opener.open("http://127.0.0.1:" + str(port) + "/health", timeout=0.2) as response:
                    ready = json.loads(response.read()).get("service") == "dataset"
                    break
            except OSError:
                time.sleep(0.1)
        assert ready
    finally:
        process.terminate()
        process.wait(timeout=5)
