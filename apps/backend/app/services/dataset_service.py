"""Idempotent ingestion using persistent operation journals and POSIX locks."""
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import hmac
import json
import logging
import os
from pathlib import Path
import re
import tempfile
import threading
import time
from uuid import UUID
from app.services.dataset_errors import DatasetError
from app.services.dataset_gateway import BUCKET

logger = logging.getLogger(__name__)
PUBLIC_FIELDS = ("id", "user_id", "proposed_label_id", "proposed_label_text", "final_label_id",
                 "recognition_event_id", "status", "rejection_reason", "revision", "size_bytes",
                 "duration_ms", "width", "height", "fps", "mime_type", "container", "codec",
                 "source_sha256", "video_policy_id", "consent_version", "consented_at",
                 "created_at", "updated_at")


def public_row(row):
    return {key: row.get(key) for key in PUBLIC_FIELDS}


class DatasetService:
    def __init__(self, gateway, inspector):
        self.gateway, self.inspector = gateway, inspector
        self.settings = gateway.settings
        self.playback_slots = threading.BoundedSemaphore(self.settings.max_parallel_uploads)

    def playback(self, row, token):
        if not self.playback_slots.acquire(blocking=False):
            raise DatasetError(429, "playback_capacity", "Pemutar sedang sibuk. Coba lagi.", True)
        try:
            self.settings.work_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
            with tempfile.TemporaryDirectory(dir=self.settings.work_dir) as directory:
                source = Path(directory) / "source.bin"
                # Both row visibility and Storage RLS use the caller's JWT.
                self.gateway.download_video(row, token, source)
                if ((row.get("mime_type") == "video/webm" and row.get("codec") in ("vp8", "vp9", "av1"))
                    or (row.get("mime_type") == "video/mp4" and row.get("codec") == "h264")):
                    return source.read_bytes(), row["mime_type"]
                return self.inspector.browser_preview(source)
        finally:
            self.playback_slots.release()

    @contextmanager
    def operation(self, cid):
        if os.name != "posix":
            raise DatasetError(503, "local_lock_unavailable", "Layanan unggahan memerlukan server Linux.")
        import fcntl
        root = self.settings.work_dir / "operations"
        root.mkdir(parents=True, exist_ok=True, mode=0o700)
        fd = os.open(root / (str(cid) + ".json"), os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, "r+") as handle:
            start = time.monotonic()
            while True:
                try:
                    fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
                    break
                except BlockingIOError:
                    if time.monotonic() - start > 5:
                        raise DatasetError(409, "upload_in_progress", "Unggahan dengan key ini sedang diproses.", True)
                    time.sleep(0.02)
            try:
                text = handle.read()
                try:
                    state = json.loads(text) if text else {}
                except ValueError:
                    raise DatasetError(503, "operation_journal_invalid", "Catatan operasi perlu diperiksa.") from None
                yield handle, state
            finally:
                fcntl.flock(handle, fcntl.LOCK_UN)

    @staticmethod
    def journal(handle, fingerprint, state):
        handle.seek(0)
        json.dump({"request_hash": fingerprint, "state": state}, handle)
        handle.truncate()
        handle.flush()
        os.fsync(handle.fileno())

    def upload(self, actor, source_file, metadata, policy, key):
        if not re.fullmatch(r"[A-Za-z0-9_-]{16,128}", key):
            raise DatasetError(422, "invalid_idempotency_key", "Gunakan Idempotency-Key sepanjang 16-128 karakter.")
        secret = self.settings.idempotency_secret.get_secret_value()
        if len(secret) < 32:
            raise DatasetError(503, "idempotency_not_configured", "Konfigurasi idempotency belum tersedia.")
        digest = hmac.new(secret.encode(), ("operation:" + str(actor.id) + ":" + key).encode(), hashlib.sha256).digest()
        cid = UUID(bytes=digest[:16], version=5)
        path = str(actor.id) + "/" + str(cid) + "/video"
        self.gateway.check_label(metadata.proposed_label_id, actor.token)
        root = self.settings.work_dir
        root.mkdir(parents=True, exist_ok=True, mode=0o700)
        with self.operation(cid) as (journal, state), tempfile.TemporaryDirectory(dir=root) as temp:
            source = Path(temp) / "source.bin"
            sha, size = hashlib.sha256(), 0
            with source.open("xb") as target:
                while block := source_file.read(65536):
                    size += len(block)
                    if size > policy.max_size_bytes:
                        raise DatasetError(413, "video_too_large", "Ukuran video melebihi policy aktif.",
                                           details={"max_size_bytes": policy.max_size_bytes})
                    target.write(block)
                    sha.update(block)
            if size == 0:
                raise DatasetError(422, "empty_video", "Berkas video kosong; rekam ulang sebelum mengirim.",
                                   details={"size_bytes": 0, "max_size_bytes": policy.max_size_bytes})
            canonical = metadata.model_dump(mode="json")
            canonical["source_sha256"] = sha.hexdigest()
            fingerprint = hashlib.sha256(json.dumps(canonical, sort_keys=True).encode()).hexdigest()
            if state.get("request_hash") and state["request_hash"] != fingerprint:
                raise DatasetError(409, "idempotency_conflict", "Idempotency key sudah dipakai untuk data berbeda.")
            previous = self.gateway.row(cid, actor.id, actor.token, service=True, include_deleted=True)
            if previous:
                if previous.get("deleted_at"):
                    raise DatasetError(409, "idempotency_retired", "Kontribusi dengan key ini sudah dihapus.")
                comparable = {k: previous.get(k) for k in ("proposed_label_id", "proposed_label_text",
                              "consent_version", "recognition_event_id", "source_sha256")}
                expected = {k: canonical.get(k) for k in comparable}
                if comparable != expected:
                    raise DatasetError(409, "idempotency_conflict", "Idempotency key sudah dipakai untuk data berbeda.")
                return previous, True
            technical = self.inspector.inspect(source, policy)
            self.journal(journal, fingerprint, "validated")
            now = datetime.now(timezone.utc).isoformat()
            row = {"id": str(cid), "user_id": str(actor.id), "video_object_path": path,
                   "video_bucket_id": BUCKET, "proposed_label_id": canonical["proposed_label_id"],
                   "proposed_label_text": canonical["proposed_label_text"],
                   "recognition_event_id": canonical["recognition_event_id"],
                   "consent_version": canonical["consent_version"], "consented_at": now,
                   "signer_pseudonym": hmac.new(secret.encode(), ("signer:" + str(actor.id)).encode(),
                                               hashlib.sha256).hexdigest()[:24],
                   "source_sha256": sha.hexdigest(), "size_bytes": size, "video_policy_id": str(policy.id),
                   "validated_at": now, **technical}
            existing_digest = self.gateway.object_digest(path, policy.max_size_bytes)
            if existing_digest is not None and existing_digest != sha.hexdigest():
                raise DatasetError(409, "idempotency_conflict", "Objek operasi berbeda dari video yang dikirim.")
            if existing_digest is None:
                try:
                    self.gateway.upload(path, source, technical["mime_type"])
                except DatasetError:
                    recovered = self.gateway.object_digest(path, policy.max_size_bytes)
                    if recovered != sha.hexdigest():
                        raise
            self.journal(journal, fingerprint, "stored_private")
            try:
                self.gateway.insert(row)
            except DatasetError as original:
                # An HTTP failure may occur AFTER a commit. Never delete that row's media.
                try:
                    committed = self.gateway.row(cid, actor.id, actor.token, service=True, include_deleted=True)
                except DatasetError:
                    self.journal(journal, fingerprint, "commit_unknown")
                    raise DatasetError(503, "upload_commit_unknown",
                                       "Hasil unggahan belum pasti; ulangi dengan key yang sama.", True) from None
                if committed:
                    if (committed.get("deleted_at") or committed.get("source_sha256") != sha.hexdigest()):
                        raise DatasetError(409, "idempotency_conflict", "Keadaan kontribusi telah berubah.")
                    self.journal(journal, fingerprint, "committed")
                    return committed, True
                if original.code == "database_write_uncertain":
                    # An absent read is not proof that an in-flight INSERT will
                    # never commit. Retain the private source for same-key recovery.
                    self.journal(journal, fingerprint, "commit_unknown")
                    raise DatasetError(503, "upload_commit_unknown",
                                       "Hasil unggahan belum pasti; ulangi dengan key yang sama.", True) from None
                try:
                    self.gateway.delete_object(path)
                    self.journal(journal, fingerprint, "compensated")
                except DatasetError:
                    # Unregistered objects are inaccessible to all caller roles under
                    # the existing restrictive Storage policies. Keep a durable marker.
                    self.journal(journal, fingerprint, "cleanup_pending")
                    logger.warning("dataset_cleanup_pending operation_id=%s", cid)
                    raise DatasetError(503, "upload_cleanup_pending",
                                       "Unggahan belum selesai; ulangi dengan key yang sama.", True) from None
                raise original
            self.journal(journal, fingerprint, "committed")
            saved = self.gateway.row(cid, actor.id, actor.token, service=True)
            return saved or {**row, "status": "PENDING", "revision": 1, "created_at": now, "updated_at": now}, False
