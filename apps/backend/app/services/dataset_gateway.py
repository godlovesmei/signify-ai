"""Configured Supabase HTTP adapter. No automatic retry, redirect, or proxy."""
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from uuid import UUID
import hashlib
import json
import re
import httpx
from app.config.dataset_settings import DatasetSettings
from app.services.dataset_errors import DatasetError, upstream_error

BUCKET = "dataset-contribution-videos"


class DatasetGateway:
    def __init__(self, settings: DatasetSettings, transport=None):
        self.settings = settings
        self.client = httpx.Client(timeout=settings.upstream_timeout_seconds, trust_env=False,
                                   follow_redirects=False, transport=transport)

    def close(self):
        self.client.close()

    def headers(self, token: str | None = None, service: bool = False):
        key = (self.settings.service_role_key if service else self.settings.anon_key).get_secret_value()
        if not key:
            raise DatasetError(503, "dataset_not_configured", "Konfigurasi dataset belum tersedia.")
        headers = {"apikey": key}
        bearer = key if service else token or key
        # Opaque API keys belong only in apikey; user JWTs stay in Authorization.
        if not bearer.startswith(("sb_publishable_", "sb_secret_")):
            headers["Authorization"] = "Bearer " + bearer
        return headers

    def url(self, path: str):
        if not path.startswith("/") or path.startswith("//") or "\\" in path or "://" in path:
            raise DatasetError(503, "invalid_upstream_path", "Konfigurasi layanan tidak valid.")
        return self.settings.supabase_url + path

    def request(self, method, path, *, token=None, service=False, operation="", exact_count=False, **kwargs):
        headers = self.headers(token, service)
        if exact_count:
            headers["Prefer"] = "count=exact"
        try:
            response = self.client.request(method, self.url(path), headers=headers, **kwargs)
        except httpx.HTTPError:
            if operation == "dataset_review_contribution":
                raise DatasetError(503, "review_commit_unknown", "Hasil peninjauan belum pasti; muat ulang antrean sebelum bertindak lagi.") from None
            code = "database_write_uncertain" if operation == "contribution_insert" else "upstream_unavailable"
            raise DatasetError(503, code, "Layanan dataset belum dapat dijangkau.", True) from None
        if response.is_redirect:
            code = "database_write_uncertain" if operation == "contribution_insert" else "upstream_redirect_rejected"
            raise DatasetError(503, code, "Pengalihan layanan ditolak.")
        if response.is_error:
            try:
                body = response.json()
            except ValueError:
                body = {}
            body = body if isinstance(body, dict) else {}
            if operation == "dataset_review_contribution" and response.status_code >= 500 and not re.fullmatch(r"[0-9A-Z]{5}", str(body.get("code", ""))):
                raise DatasetError(503, "review_commit_unknown", "Hasil peninjauan belum pasti; muat ulang antrean sebelum bertindak lagi.")
            # A PostgreSQL error response confirms transaction failure. A proxy
            # timeout/error does not establish whether its upstream write stopped.
            if operation == "contribution_insert" and not re.fullmatch(r"[0-9A-Z]{5}", str(body.get("code", ""))):
                raise DatasetError(503, "database_write_uncertain", "Hasil penulisan belum dapat dipastikan.", True)
            raise upstream_error(response.status_code, body, operation)
        return response

    def policy(self, token):
        from app.schemas.dataset import VideoPolicy
        from pydantic import ValidationError
        rows = self.request("GET", "/rest/v1/dataset_video_policies", token=token,
                            params={"select": "*", "is_active": "eq.true"}).json()
        if not isinstance(rows, list) or len(rows) != 1:
            raise DatasetError(503, "video_policy_unavailable", "Konfigurasi unggahan video belum tersedia.")
        try:
            return VideoPolicy.model_validate(rows[0])
        except ValidationError:
            raise DatasetError(503, "video_policy_invalid", "Konfigurasi unggahan video tidak lengkap.") from None

    def row(self, cid: UUID, uid: UUID, token: str, *, service=False, owner_only=True, include_deleted=False):
        params = {"id": "eq." + str(cid), "select": "*", "limit": "1"}
        if not include_deleted:
            params["deleted_at"] = "is.null"
        if owner_only:
            params["user_id"] = "eq." + str(uid)
        rows = self.request("GET", "/rest/v1/dataset_contributions", token=token, service=service,
                            params=params).json()
        if not isinstance(rows, list):
            raise DatasetError(503, "invalid_upstream_response", "Respons layanan tidak valid.")
        return rows[0] if rows else None

    def list_rows(self, uid, token, limit, offset, *, status=None, search=""):
        params = {"user_id": "eq." + str(uid), "deleted_at": "is.null",
                  "order": "created_at.desc,id.desc", "limit": str(limit + 1),
                  "offset": str(offset), "select": "*"}
        if status:
            params["status"] = "eq." + status
        self._search_filter(params, token, search)
        response = self.request("GET", "/rest/v1/dataset_contributions", token=token,
                                params=params, exact_count=True)
        total = response.headers.get("content-range", "").rsplit("/", 1)[-1]
        if not total.isascii() or not total.isdigit():
            raise DatasetError(503, "invalid_upstream_response", "Jumlah kontribusi belum tersedia.")
        return response.json(), int(total)

    def _search_filter(self, params, token, search):
        if search:
            # Double-quoted PostgREST values prevent filter grammar injection.
            # Search wildcards have their usual ilike meaning; ownership is
            # always a separate AND filter, enforced again by the caller's RLS.
            pattern = "*" + search + "*"
            matches = self.request("GET", "/rest/v1/dataset_labels", token=token,
                                   params={"select": "id", "display_name": "ilike." + pattern}).json()
            ids = ",".join(str(UUID(row["id"])) for row in matches)
            clauses = ["proposed_label_text.ilike." + json.dumps(pattern, ensure_ascii=False)]
            if ids:
                clauses += ["proposed_label_id.in.(" + ids + ")", "final_label_id.in.(" + ids + ")"]
            params["or"] = "(" + ",".join(clauses) + ")"

    def summary(self, uid, token):
        counts = {}
        for status in ("PENDING", "APPROVED", "REJECTED"):
            response = self.request("HEAD", "/rest/v1/dataset_contributions", token=token, exact_count=True,
                                    params={"user_id": "eq." + str(uid), "deleted_at": "is.null",
                                            "status": "eq." + status, "select": "id", "limit": "0"})
            total = response.headers.get("content-range", "").rsplit("/", 1)[-1]
            if not total.isascii() or not total.isdigit():
                raise DatasetError(503, "invalid_upstream_response", "Ringkasan kontribusi belum tersedia.")
            counts[status] = int(total)
        return {"total": sum(counts.values()), **counts}

    def labels(self, token):
        return self.request("GET", "/rest/v1/dataset_labels", token=token,
                            params={"select": "id,code,display_name,description",
                                    "is_active": "eq.true", "order": "display_name.asc,id.asc"}).json()

    def access(self, token):
        result = self.request("POST", "/rest/v1/rpc/dataset_access_info", token=token, json={}).json()
        if not isinstance(result, dict) or any(type(result.get(key)) is not bool for key in ("is_admin", "is_curator", "review_available")):
            raise DatasetError(503, "invalid_upstream_response", "Informasi akses belum tersedia.")
        return result

    def list_curators(self, token):
        return self.request("POST", "/rest/v1/rpc/dataset_list_curators", token=token, json={}).json()

    def grant_curator(self, token, data):
        return self.request("POST", "/rest/v1/rpc/dataset_grant_curator", token=token,
            operation="dataset_curator_access", json={"p_email": data.email, "p_qualification_note": data.qualification_note}).json()

    def revoke_curator(self, token, uid, data):
        return self.request("POST", "/rest/v1/rpc/dataset_revoke_curator", token=token,
            operation="dataset_curator_access", json={"p_user_id": str(uid), "p_expected_granted_at": data.expected_granted_at.isoformat()}).json()

    def review_queue(self, token, limit, offset, search="", status="PENDING"):
        params = {"deleted_at": "is.null", "select": "*",
                  "order": "created_at.desc,id.desc", "limit": str(limit + 1), "offset": str(offset)}
        if status != "ALL":
            params["status"] = "eq." + status
        self._search_filter(params, token, search)
        response = self.request("GET", "/rest/v1/dataset_contributions", token=token, exact_count=True, params=params)
        total = response.headers.get("content-range", "").rsplit("/", 1)[-1]
        if not total.isascii() or not total.isdigit():
            raise DatasetError(503, "invalid_upstream_response", "Jumlah antrean belum tersedia.")
        return response.json(), int(total)

    def review_summary(self, token):
        counts = {}
        for status in ("PENDING", "APPROVED", "REJECTED"):
            response = self.request("HEAD", "/rest/v1/dataset_contributions", token=token, exact_count=True,
                params={"deleted_at": "is.null", "status": "eq." + status, "select": "id", "limit": "0"})
            total = response.headers.get("content-range", "").rsplit("/", 1)[-1]
            if not total.isascii() or not total.isdigit():
                raise DatasetError(503, "invalid_upstream_response", "Ringkasan kurasi belum tersedia.")
            counts[status] = int(total)
        return {"total": sum(counts.values()), **counts}

    def review(self, cid, token, review):
        payload = {"p_contribution_id": str(cid), "p_expected_revision": review.expected_revision,
            "p_decision": review.decision, "p_final_label_id": str(review.final_label_id) if review.final_label_id else None,
            "p_reason": review.reason}
        if review.final_label_text is not None:
            payload["p_final_label_text"] = review.final_label_text
        return self.request("POST", "/rest/v1/rpc/dataset_review_contribution", token=token,
            operation="dataset_review_contribution", json=payload).json()

    def check_label(self, label: UUID | None, token):
        if label:
            rows = self.request("GET", "/rest/v1/dataset_labels", token=token,
                                params={"id": "eq." + str(label), "is_active": "eq.true",
                                        "select": "id"}).json()
            if not rows:
                raise DatasetError(422, "label_unavailable", "Label kontribusi tidak tersedia.")

    def insert(self, row):
        return self.request("POST", "/rest/v1/dataset_contributions", service=True,
                            operation="contribution_insert", json=row)

    def upload(self, path, source: Path, mime):
        # No upsert: a retry must never overwrite an already committed source.
        try:
            with source.open("rb") as data:
                response = self.client.post(self.url("/storage/v1/object/" + BUCKET + "/" + path),
                    headers={**self.headers(service=True), "Content-Type": mime, "x-upsert": "false"}, content=data)
        except httpx.HTTPError:
            raise DatasetError(503, "storage_write_uncertain", "Hasil penyimpanan belum dapat dipastikan.", True) from None
        if response.status_code >= 300:
            # Duplicate/ambiguous writes are reconciled by digest under the operation lock.
            raise DatasetError(503, "storage_write_uncertain", "Hasil penyimpanan belum dapat dipastikan.", True)

    def object_digest(self, path, maximum):
        try:
            with self.client.stream("GET", self.url("/storage/v1/object/" + BUCKET + "/" + path),
                                    headers=self.headers(service=True)) as response:
                if response.status_code in (400, 404):
                    try:
                        code = response.json().get("error")
                    except (ValueError, httpx.ResponseNotRead):
                        code = None
                    # Storage frequently masks missing objects as HTTP 400.
                    if response.status_code == 404:
                        return None
                    raw = response.read()
                    try:
                        body = __import__("json").loads(raw)
                    except ValueError:
                        body = {}
                    if body.get("error") == "NoSuchKey" or str(body.get("statusCode")) == "404":
                        return None
                    raise DatasetError(503, "storage_read_uncertain", "Keadaan objek belum dapat dipastikan.", True)
                if response.status_code != 200:
                    raise DatasetError(503, "storage_read_uncertain", "Keadaan objek belum dapat dipastikan.", True)
                digest, total = hashlib.sha256(), 0
                for block in response.iter_bytes(65536):
                    total += len(block)
                    if total > maximum:
                        raise DatasetError(409, "idempotency_conflict", "Idempotency key sudah dipakai untuk data berbeda.")
                    digest.update(block)
                return digest.hexdigest()
        except httpx.HTTPError:
            raise DatasetError(503, "storage_read_uncertain", "Keadaan objek belum dapat dipastikan.", True) from None

    def delete_object(self, path):
        self.request("DELETE", "/storage/v1/object/" + BUCKET, service=True, json={"prefixes": [path]})

    def video_reference(self, row):
        expected = str(UUID(row["user_id"])) + "/" + str(UUID(row["id"])) + "/video"
        if row["video_object_path"] != expected or row["video_bucket_id"] != BUCKET:
            raise DatasetError(503, "invalid_object_reference", "Referensi video tidak valid.")
        if not row.get("consent_version") or not row.get("consented_at") or row.get("deleted_at"):
            raise DatasetError(403, "operation_forbidden", "Persetujuan video tidak tersedia.")
        return expected

    def download_video(self, row, token, target):
        expected = self.video_reference(row)
        try:
            with self.client.stream("GET", self.url("/storage/v1/object/" + BUCKET + "/" + expected),
                                    headers=self.headers(token)) as response:
                if response.status_code != 200:
                    raise DatasetError(403 if response.status_code in (400, 401, 403, 404) else 503,
                                       "video_unavailable", "Video belum dapat dimuat.")
                size, digest = 0, hashlib.sha256()
                with target.open("xb") as output:
                    for block in response.iter_bytes(65536):
                        size += len(block)
                        if size > self.settings.playback_max_bytes:
                            raise DatasetError(413, "video_too_large", "Video melebihi batas pemutaran.")
                        digest.update(block)
                        output.write(block)
                if not size or size != row["size_bytes"] or digest.hexdigest() != row["source_sha256"]:
                    raise DatasetError(422, "video_source_changed", "Sumber video tidak sesuai rekaman kontribusi.")
        except httpx.HTTPError:
            raise DatasetError(503, "video_unavailable", "Video belum dapat dimuat.", True) from None

    def video_access(self, row, token):
        expected = self.video_reference(row)
        result = self.request("POST", "/storage/v1/object/sign/" + BUCKET + "/" + expected, token=token,
                              json={"expiresIn": self.settings.signed_url_seconds}).json()
        signed = result.get("signedURL") or result.get("signedUrl")
        if not isinstance(signed, str):
            raise DatasetError(503, "invalid_upstream_response", "Respons layanan tidak valid.")
        url = urljoin(self.settings.supabase_url + "/storage/v1/", signed.lstrip("/"))
        if signed.startswith("/object/"):
            url = self.settings.supabase_url + "/storage/v1" + signed
        parsed, base = urlsplit(url), urlsplit(self.settings.supabase_url)
        if (parsed.scheme, parsed.netloc) != (base.scheme, base.netloc) or parsed.username:
            raise DatasetError(503, "remote_url_rejected", "URL video di luar layanan Supabase yang dikonfigurasi ditolak.")
        return {"url": url, "expires_in": self.settings.signed_url_seconds}
