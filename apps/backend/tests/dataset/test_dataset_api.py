import shutil
"""Hermetic API/security/failure-path tests. All upstream requests use MockTransport."""
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from uuid import uuid4
import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from fastapi.testclient import TestClient
from app.config.dataset_settings import DatasetSettings, DEVELOPMENT_ENV
from app.schemas.dataset import VideoPolicy
from app.services.dataset_errors import DatasetError, upstream_error
from app.services.dataset_gateway import DatasetGateway, BUCKET
from app.services.dataset_media import VideoInspector
from dataset_main import create_app

SECRET = "synthetic-auth-key-with-at-least-32-bytes"
UID, OTHER, LABEL, POLICY = (str(uuid4()) for _ in range(4))
FFMPEG = os.environ.get("DATASET_TEST_FFMPEG") or shutil.which("ffmpeg") or "ffmpeg"
FFPROBE = str(Path(FFMPEG).with_name("ffprobe"))
POLICY_ROW = {"id": POLICY, "version": "synthetic-unit-v1", "min_duration_ms": 1,
              "max_duration_ms": 10000, "min_short_side_px": 16, "max_long_side_px": 1024,
              "max_size_bytes": 100000, "allowed_mime_types": ["video/x-msvideo"], "is_active": True}
TECHNICAL = {"duration_ms": 200, "width": 64, "height": 48, "fps": 10.0,
             "mime_type": "video/x-msvideo", "container": "avi", "codec": "rawvideo"}
META = {"proposed_label_id": LABEL, "consent": True, "consent_version": "synthetic-consent-v1"}


def token(**changes):
    claims = {"sub": UID, "role": "authenticated", "aud": "authenticated",
              "iss": "http://127.0.0.1:55431/auth/v1", "exp": int(time.time()) + 300}
    claims.update(changes)
    return jwt.encode(claims, SECRET, algorithm="HS256")


class FakeSupabase:
    def __init__(self):
        self.rows, self.objects, self.requests, self.keys = {}, {}, [], []
        self.active = True
        self.insert_failure = None
        self.storage_failure = False
        self.delete_failure = False
        self.fail_reads_after_insert = False
        self.insert_attempts = 0

    def __call__(self, request):
        assert request.url.scheme == "http" and request.url.host == "127.0.0.1"
        self.requests.append((request.method, request.url.path))
        path, query = request.url.path, dict(request.url.params)
        if path == "/auth/v1/.well-known/jwks.json":
            return httpx.Response(200, json={"keys": self.keys})
        if path == "/rest/v1/rpc/dataset_access_info":
            return httpx.Response(200, json={"is_admin": False, "is_curator": False, "review_available": False})
        if path == "/auth/v1/user":
            return httpx.Response(200, json={"id": UID})
        if path.endswith("/dataset_video_policies"):
            return httpx.Response(200, json=[POLICY_ROW] if self.active else [])
        if path.endswith("/dataset_labels"):
            return httpx.Response(200, json=[{"id": LABEL}])
        if path == "/rest/v1/dataset_contributions":
            if request.method == "POST":
                self.insert_attempts += 1
                row = json.loads(request.read())
                if self.insert_failure in ("delayed_transport", "delayed_proxy"):
                    self.pending_row = {**row, "status": "PENDING", "revision": 1}
                    if self.insert_failure == "delayed_transport":
                        raise httpx.ReadTimeout("synthetic timeout", request=request)
                    return httpx.Response(504, text="synthetic proxy timeout")
                if self.insert_failure == "committed":
                    self.rows[row["id"]] = {**row, "status": "PENDING", "revision": 1}
                if self.insert_failure:
                    return httpx.Response(500, json={"code": "XX000", "message": "private upstream error"})
                self.rows[row["id"]] = {**row, "status": "PENDING", "revision": 1}
                return httpx.Response(201, json=None)
            if self.fail_reads_after_insert and self.insert_attempts:
                return httpx.Response(503, json={})
            rows = list(self.rows.values())
            for field in ("id", "user_id"):
                if field in query:
                    rows = [r for r in rows if r.get(field) == query[field][3:]]
            if query.get("deleted_at") == "is.null":
                rows = [r for r in rows if not r.get("deleted_at")]
            return httpx.Response(200, json=rows, headers={"Content-Range": "*/" + str(len(rows))})
        storage = "/storage/v1/object/"
        if path == storage + BUCKET and request.method == "DELETE":
            if self.delete_failure:
                return httpx.Response(503, json={})
            for key in json.loads(request.read())["prefixes"]:
                self.objects.pop(key, None)
            return httpx.Response(200, json=[])
        if path.startswith(storage + "sign/"):
            return httpx.Response(200, json={"signedURL": "/object/sign/" + BUCKET + "/synthetic?token=synthetic"})
        if path.startswith(storage + BUCKET + "/"):
            key = path.split(storage + BUCKET + "/", 1)[1]
            if request.method == "POST":
                if self.storage_failure:
                    return httpx.Response(503, json={})
                self.objects[key] = request.read()
                return httpx.Response(200, json={})
            if key not in self.objects:
                return httpx.Response(400, json={"error": "NoSuchKey", "statusCode": "404"})
            return httpx.Response(200, content=self.objects[key])
        raise AssertionError("Unexpected local mock endpoint")


@pytest.fixture
def setup(tmp_path):
    upstream = FakeSupabase()
    settings = DatasetSettings(_env_file=None, anon_key="synthetic-local-anon",
                               service_role_key="synthetic-local-service", jwt_hs256_secret=SECRET,
                               idempotency_secret="synthetic-idempotency-secret-at-least-32",
                               work_dir=tmp_path, ffmpeg=FFMPEG, ffprobe=FFPROBE)
    app = create_app(settings, httpx.MockTransport(upstream))
    app.state.dataset_service.inspector.inspect = lambda _source, _policy: TECHNICAL
    with TestClient(app) as client:
        yield client, app, upstream, settings


def upload(client, *, value=b"synthetic video", meta=None, key="synthetic-key-0001", authorization=None):
    return client.post("/api/v1/contributions",
                       headers={"Authorization": authorization or "Bearer " + token(), "Idempotency-Key": key},
                       files={"file": ("../../untrusted.mp4", value, "application/octet-stream")},
                       data={"metadata": json.dumps(META if meta is None else meta)})


@pytest.mark.parametrize("path,method", [
    ("/api/v1/contributions", "GET"), ("/api/v1/contributions", "POST"),
    ("/api/v1/dataset/video-policy", "GET"),
    ("/api/v1/contributions/" + str(uuid4()), "GET"),
    ("/api/v1/contributions/" + str(uuid4()) + "/video-access", "POST"),
])
def test_every_dataset_endpoint_requires_auth(setup, path, method):
    client, _, upstream, _ = setup
    response = client.request(method, path)
    assert response.status_code == 401
    assert not upstream.requests


@pytest.mark.parametrize("changes", [
    {"exp": int(time.time()) - 10}, {"iss": "https://untrusted.example/auth/v1"},
    {"aud": "wrong"}, {"sub": "not-a-uuid"}, {"role": "service_role"},
])
def test_invalid_claims_fail_before_auth_network(setup, changes):
    client, _, upstream, _ = setup
    response = client.get("/api/v1/contributions", headers={"Authorization": "Bearer " + token(**changes)})
    assert response.status_code == 401
    assert not upstream.requests


def test_wrong_signature_and_malformed_token(setup):
    client, _, upstream, _ = setup
    for value in ("broken", jwt.encode({"sub": UID}, "different-test-secret-at-least-32-bytes", algorithm="HS256")):
        assert client.get("/api/v1/contributions", headers={"Authorization": "Bearer " + value}).status_code == 401
    assert not upstream.requests


@pytest.mark.parametrize("algorithm", ["ES256", "RS256"])
def test_asymmetric_jwks_from_fixed_local_origin(setup, algorithm):
    client, _, upstream, _ = setup
    key = ec.generate_private_key(ec.SECP256R1()) if algorithm == "ES256" else rsa.generate_private_key(65537, 2048)
    codec = jwt.algorithms.ECAlgorithm if algorithm == "ES256" else jwt.algorithms.RSAAlgorithm
    jwk = json.loads(codec.to_jwk(key.public_key()))
    jwk.update({"kid": "synthetic-" + algorithm, "alg": algorithm, "use": "sig"})
    upstream.keys = [jwk]
    payload = jwt.decode(token(), SECRET, algorithms=["HS256"], audience="authenticated")
    signed = jwt.encode(payload, key, algorithm=algorithm, headers={"kid": jwk["kid"], "jku": "https://untrusted.example/keys"})
    response = client.get("/api/v1/contributions", headers={"Authorization": "Bearer " + signed})
    assert response.status_code == 200
    assert ("GET", "/auth/v1/.well-known/jwks.json") in upstream.requests


def test_valid_token_sub_must_match_auth_user(setup):
    client, _, _, _ = setup
    response = client.get("/api/v1/contributions", headers={"Authorization": "Bearer " + token(sub=OTHER)})
    assert response.status_code == 401


def test_no_policy_rejects_before_multipart_body(setup):
    client, _, upstream, _ = setup
    upstream.active = False
    response = upload(client)
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "video_policy_unavailable"
    assert not upstream.rows and not upstream.objects


@pytest.mark.parametrize("meta", [
    {}, {**META, "consent": False}, {**META, "consent_version": " "},
    {**META, "user_id": OTHER}, {"consent": True, "consent_version": "v1"},
])
def test_incomplete_metadata_or_forged_owner_rejected(setup, meta):
    client, _, upstream, _ = setup
    assert upload(client, meta=meta).status_code == 422
    assert not upstream.rows and not upstream.objects


def test_upload_and_exact_retry_one_record(setup):
    client, _, upstream, _ = setup
    first, replay = upload(client), upload(client)
    assert first.status_code == 201 and replay.status_code == 200
    assert first.json()["contribution"]["id"] == replay.json()["contribution"]["id"]
    assert first.json()["contribution"]["user_id"] == UID
    assert first.json()["contribution"]["status"] == "PENDING"
    assert replay.json()["replayed"] is True
    assert len(upstream.rows) == len(upstream.objects) == upstream.insert_attempts == 1


def test_changed_payload_same_key_conflict(setup):
    client, _, upstream, _ = setup
    assert upload(client).status_code == 201
    response = upload(client, value=b"different video")
    assert response.status_code == 409
    assert len(upstream.rows) == 1


def test_soft_deleted_idempotency_key_not_reused(setup):
    client, _, upstream, _ = setup
    assert upload(client).status_code == 201
    next(iter(upstream.rows.values()))["deleted_at"] = "synthetic-time"
    assert upload(client).status_code == 409
    assert upstream.insert_attempts == 1


def test_storage_failure_never_creates_candidate(setup):
    client, _, upstream, _ = setup
    upstream.storage_failure = True
    assert upload(client).status_code == 503
    assert not upstream.rows and not upstream.objects


def test_database_failure_compensates_storage(setup):
    client, _, upstream, _ = setup
    upstream.insert_failure = "rejected"
    assert upload(client).status_code == 503
    assert not upstream.rows and not upstream.objects


def test_database_unknown_commit_reconciles_without_deleting_source(setup):
    client, _, upstream, _ = setup
    upstream.insert_failure = "committed"
    response = upload(client)
    assert response.status_code == 200
    assert len(upstream.rows) == len(upstream.objects) == 1


def test_unreachable_commit_status_preserves_object_and_marker(setup):
    client, _, upstream, settings = setup
    upstream.insert_failure = "committed"
    upstream.fail_reads_after_insert = True
    response = upload(client)
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "upload_commit_unknown"
    assert len(upstream.objects) == 1
    state = json.loads(next((settings.work_dir / "operations").glob("*.json")).read_text())
    assert state["state"] == "commit_unknown"


def test_failed_compensation_is_private_and_durable(setup):
    client, _, upstream, settings = setup
    upstream.insert_failure, upstream.delete_failure = "rejected", True
    response = upload(client)
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "upload_cleanup_pending"
    assert not upstream.rows and len(upstream.objects) == 1
    state = json.loads(next((settings.work_dir / "operations").glob("*.json")).read_text())
    assert state["state"] == "cleanup_pending"
    # No ownership row means a caller cannot fetch a media reference through this API.
    cid = next((settings.work_dir / "operations").glob("*.json")).stem
    assert client.post("/api/v1/contributions/" + cid + "/video-access",
                       headers={"Authorization": "Bearer " + token()}).status_code == 404


def test_other_owner_detail_is_not_exposed(setup):
    client, _, upstream, _ = setup
    result = upload(client)
    cid = result.json()["contribution"]["id"]
    upstream.rows[cid]["user_id"] = OTHER
    response = client.get("/api/v1/contributions/" + cid, headers={"Authorization": "Bearer " + token()})
    assert response.status_code == 404


def test_signed_video_reference_uses_caller_identity(setup):
    client, _, _, _ = setup
    cid = upload(client).json()["contribution"]["id"]
    response = client.post("/api/v1/contributions/" + cid + "/video-access",
                           headers={"Authorization": "Bearer " + token()})
    assert response.status_code == 200
    assert response.json()["url"].startswith("http://127.0.0.1:55431/storage/v1/object/sign/")
    assert response.json()["expires_in"] <= 300


def test_streamed_chunked_body_is_bounded(setup):
    client, _, upstream, _ = setup
    body = (b"--none\r\nContent-Disposition: form-data; name=\"file\"; filename=\"test.avi\"\r\n"
            b"Content-Type: video/x-msvideo\r\n\r\n" + b"x" * 220000 + b"\r\n--none--\r\n")
    def chunks():
        for offset in range(0, len(body), 16384):
            yield body[offset:offset + 16384]
    response = client.post("/api/v1/contributions",
                           headers={"Authorization": "Bearer " + token(),
                                    "Content-Type": "multipart/form-data; boundary=none",
                                    "Idempotency-Key": "synthetic-key-large"}, content=chunks())
    assert response.status_code == 413
    assert not upstream.rows and not upstream.objects


def test_file_size_exact_policy_limit_not_browser_mime(setup):
    client, _, upstream, _ = setup
    assert upload(client, value=b"x" * (POLICY_ROW["max_size_bytes"] + 1)).status_code == 413
    assert not upstream.objects


def test_remote_settings_rejected_and_legacy_environment_not_loaded(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://untrusted.example")
    assert DatasetSettings(_env_file=None).supabase_url == "http://127.0.0.1:55431"
    assert DEVELOPMENT_ENV.name == ".env.dataset.local"
    with pytest.raises(ValueError):
        DatasetSettings(_env_file=None, supabase_url="https://untrusted.example")
    with pytest.raises(ValueError):
        DatasetSettings(_env_file=None, supabase_url="http://127.0.0.1:55431@untrusted.example")


def test_stale_revision_and_serialization_are_distinct():
    stale = {"code": "40001", "message": "Contribution revision changed"}
    assert upstream_error(500, stale, "dataset_review_contribution").status == 409
    assert upstream_error(500, stale, "dataset_soft_delete_contribution").code == "candidate_revision_conflict"
    assert upstream_error(500, stale, "unrelated_rpc").status == 503
    serial = {"code": "40001", "message": "could not serialize access due to concurrent update"}
    assert upstream_error(500, serial, "dataset_review_contribution").code == "database_serialization_failure"


def test_no_automatic_retry_of_uncertain_writes(setup):
    _, _, _, settings = setup
    attempts = []
    def failure(request):
        attempts.append(request)
        return httpx.Response(500, json={"code": "40001", "message": "serialization failure"})
    gateway = DatasetGateway(settings, httpx.MockTransport(failure))
    with pytest.raises(DatasetError) as exc:
        gateway.request("POST", "/rest/v1/dataset_contributions", service=True, json={})
    assert exc.value.status == 503
    assert len(attempts) == 1
    gateway.close()


def test_dataset_entrypoint_does_not_import_yolo():
    root = str(Path(__file__).resolve().parents[2])
    command = [sys.executable, "-c",
               "import sys; sys.path.insert(0," + repr(root) + "); import dataset_main; "
               "assert 'ultralytics' not in sys.modules; assert 'app.services.ml_service' not in sys.modules"]
    assert subprocess.run(command, capture_output=True).returncode == 0


@pytest.fixture
def real_media(tmp_path):
    if not all(shutil.which(tool) for tool in (FFMPEG, FFPROBE, "prlimit")):
        pytest.skip("Provide FFmpeg/FFprobe/prlimit to run real media tests")
    settings = DatasetSettings(_env_file=None, ffmpeg=FFMPEG, ffprobe=FFPROBE)
    inspector = VideoInspector(settings)
    import importlib.util
    source = Path(__file__).resolve().parents[4] / "supabase/tests/integration/test_auth_storage_local.py"
    spec = importlib.util.spec_from_file_location("synthetic_video_fixture", source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    path = tmp_path / "server-generated.bin"
    # The AVI writer explicitly stores 2 frames at 10 fps (200 ms), including
    # the final frame's 100 ms presentation interval. No FFmpeg defaults apply.
    path.write_bytes(module.synthetic_avi())
    return inspector, path, VideoPolicy.model_validate(POLICY_ROW)


def test_real_ffmpeg_decodes_avi_without_using_extension(real_media):
    inspector, path, policy = real_media
    result = inspector.inspect(path, policy)
    assert result["mime_type"] == "video/x-msvideo"
    assert result["codec"] == "rawvideo" and result["width"] == 64 and result["height"] == 48
    assert result["duration_ms"] == 200 and result["fps"] == 10


def test_corrupt_media_is_rejected(real_media):
    inspector, path, policy = real_media
    path.write_bytes(b"not video")
    with pytest.raises(DatasetError) as exc:
        inspector.inspect(path, policy)
    assert exc.value.status == 422


def test_audio_only_is_rejected(real_media):
    inspector, path, policy = real_media
    import wave
    with wave.open(str(path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(8000)
        audio.writeframes(b"\0" * 1600)
    with pytest.raises(DatasetError) as exc:
        inspector.inspect(path, policy)
    assert exc.value.status == 422


def test_incomplete_probe_metadata_is_rejected(real_media, monkeypatch):
    inspector, path, policy = real_media
    monkeypatch.setattr(inspector, "run_tool", lambda *_: json.dumps(
        {"streams": [{"codec_type": "video", "width": 64}], "format": {"format_name": "avi"}}).encode())
    with pytest.raises(DatasetError) as exc:
        inspector.inspect(path, policy)
    assert exc.value.code == "video_metadata_incomplete"


def test_decoder_timeout_is_enforced(real_media, tmp_path):
    inspector, _, _ = real_media
    sleeper = tmp_path / "slow-tool"
    sleeper.write_text("#!/bin/sh\nexec /bin/sleep 5\n")
    sleeper.chmod(0o700)
    inspector.settings.process_timeout_seconds = 1
    start = time.monotonic()
    with pytest.raises(DatasetError) as exc:
        inspector.run_tool(str(sleeper), [], tmp_path, "timeout")
    assert exc.value.code == "media_processing_limit"
    assert time.monotonic() - start < 3


def test_policy_resolution_and_container_checked_after_probe(real_media):
    inspector, path, policy = real_media
    policy.min_short_side_px = 100
    with pytest.raises(DatasetError) as exc:
        inspector.inspect(path, policy)
    assert exc.value.code == "resolution_not_allowed"


def test_concurrent_retries_create_one_candidate(setup):
    from concurrent.futures import ThreadPoolExecutor
    client, _, upstream, _ = setup
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(lambda _: upload(client), range(2)))
    assert sorted(r.status_code for r in responses) == [200, 201]
    assert upstream.insert_attempts == len(upstream.rows) == len(upstream.objects) == 1


def test_empty_video_and_missing_idempotency_header(setup):
    client, _, upstream, _ = setup
    assert upload(client, value=b"").status_code == 422
    response = client.post("/api/v1/contributions", headers={"Authorization": "Bearer " + token()},
                           files={"file": ("video", b"x")}, data={"metadata": json.dumps(META)})
    assert response.status_code == 422
    assert not upstream.rows and not upstream.objects


def test_real_mp4_rotation_and_codec(real_media):
    inspector, path, policy = real_media
    movie = path.parent / "synthetic.mp4"
    rotated = path.parent / "rotated.bin"
    inspector.run_tool(FFMPEG, ["-v", "error", "-cpucount", "1", "-threads", "1", "-i", str(path),
                               "-an", "-c:v", "mpeg4", "-threads", "1", str(movie)], path.parent, "generate-mp4")
    inspector.run_tool(FFMPEG, ["-v", "error", "-cpucount", "1", "-display_rotation:v:0", "90",
                               "-i", str(movie), "-c", "copy", "-f", "mp4", str(rotated)], path.parent, "rotate-mp4")
    policy.allowed_mime_types = ["video/mp4"]
    result = inspector.inspect(rotated, policy)
    assert result["width"] == 48 and result["height"] == 64
    assert result["mime_type"] == "video/mp4" and result["codec"] == "mpeg4"
    assert result["duration_ms"] == 200


def test_actual_allowed_container_without_video_stream(real_media):
    inspector, path, policy = real_media
    audio = path.parent / "audio-only.mp4"
    inspector.run_tool(FFMPEG, ["-v", "error", "-cpucount", "1", "-f", "lavfi",
                               "-i", "anullsrc=r=8000:cl=mono", "-t", "0.2", "-c:a", "aac",
                               "-threads", "1", str(audio)], path.parent, "generate-audio")
    policy.allowed_mime_types = ["video/mp4"]
    with pytest.raises(DatasetError) as exc:
        inspector.inspect(audio, policy)
    assert exc.value.code == "video_metadata_incomplete"


def test_openapi_declares_bearer_and_required_upload_fields(setup):
    _client, app, _upstream, _settings = setup
    schema = app.openapi()
    assert schema["components"]["securitySchemes"]["HTTPBearer"]["scheme"] == "bearer"
    upload_operation = schema["paths"]["/api/v1/contributions"]["post"]
    assert upload_operation["security"] == [{"HTTPBearer": []}]
    assert any(p["name"] == "Idempotency-Key" and p["required"] for p in upload_operation["parameters"])
    assert upload_operation["requestBody"]["required"]


@pytest.mark.parametrize("failure", ["delayed_transport", "delayed_proxy"])
def test_delayed_commit_after_absent_read_never_deletes_source(setup, failure):
    client, _, upstream, settings = setup
    upstream.insert_failure = failure
    response = upload(client)
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "upload_commit_unknown"
    assert not upstream.rows and len(upstream.objects) == 1
    assert not any(method == "DELETE" for method, _path in upstream.requests)
    state = json.loads(next((settings.work_dir / "operations").glob("*.json")).read_text())
    assert state["state"] == "commit_unknown"
    # The original transaction finishes only AFTER the failed HTTP response and
    # the reconciliation read. The same-key retry must preserve its sole video.
    pending = upstream.pending_row
    upstream.rows[pending["id"]] = pending
    upstream.insert_failure = None
    retried = upload(client)
    assert retried.status_code == 200 and retried.json()["replayed"] is True
    assert retried.json()["contribution"]["id"] == pending["id"]
    assert len(upstream.rows) == len(upstream.objects) == upstream.insert_attempts == 1


@pytest.mark.parametrize("reported_fps", [None, "0/0", "N/A"])
def test_live_recording_without_declared_fps_is_measured_from_decoded_frames(real_media, monkeypatch, reported_fps):
    inspector, path, policy = real_media
    run_tool = inspector.run_tool
    calls = []

    def missing_fps(tool, args, directory, name):
        calls.append(name)
        output = run_tool(tool, args, directory, name)
        if name == "probe":
            data = json.loads(output)
            stream = data["streams"][0]
            for field in ("avg_frame_rate", "r_frame_rate"):
                if reported_fps is None:
                    stream.pop(field, None)
                else:
                    stream[field] = reported_fps
            for field in ("duration", "duration_ts", "nb_frames"):
                stream.pop(field, None)
            data["format"].pop("duration", None)
            return json.dumps(data).encode()
        return output

    monkeypatch.setattr(inspector, "run_tool", missing_fps)
    result = inspector.inspect(path, policy)
    assert result["duration_ms"] == 200
    assert result["fps"] == 10
    assert calls == ["probe", "decode"]
