#!/usr/bin/env python3
"""Opt-in integration tests against the existing, isolated LOCAL Supabase stack.
No .env files, remote URLs, migrations, schema changes, or RLS changes are used.
Secrets and account passwords live only in memory; reports contain redacted evidence.
"""
import argparse
import base64
import concurrent.futures
import hashlib
import hmac
import io
import json
import pathlib
import re
import secrets
import struct
import subprocess
import sys
import threading
import time
import tomllib
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone

DOCKER = ["docker", "--host", "unix:///var/run/docker.sock"]
PROJECT = "signify-supabase-local"
NETWORK = "signify-local-only"
API = "http://127.0.0.1:55431"
BUCKET = "dataset-contribution-videos"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def literal(value):
    return "'" + str(value).replace("'", "''") + "'"


def b64url(data):
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def jwt_part(value):
    return json.loads(base64.urlsafe_b64decode(value + "=" * (-len(value) % 4)))


def synthetic_avi():
    """Two uncompressed RGB frames, not a real person's recording."""
    width, height, rate, count = 64, 48, 10, 2
    stride = (width * 3 + 3) & ~3
    frame_size = stride * height

    def chunk(tag, data):
        return tag + struct.pack("<I", len(data)) + data + (b"\0" if len(data) % 2 else b"")

    avih = struct.pack("<14I", 1000000 // rate, frame_size * rate, 0, 0x10,
                       count, 0, 1, frame_size, width, height, 0, 0, 0, 0)
    strh = struct.pack("<4s4sIHH8I4h", b"vids", b"DIB ", 0, 0, 0,
                       0, 1, rate, 0, count, frame_size, 0xFFFFFFFF, 0,
                       0, 0, width, height)
    strf = struct.pack("<IiiHHIIiiII", 40, width, height, 1, 24, 0, frame_size, 0, 0, 0, 0)
    stream = chunk(b"LIST", b"strl" + chunk(b"strh", strh) + chunk(b"strf", strf))
    header = chunk(b"LIST", b"hdrl" + chunk(b"avih", avih) + stream)
    frames, index, offset = [], [], 4
    for color in ((40, 100, 180), (180, 100, 40)):
        row = bytes(color) * width + b"\0" * (stride - width * 3)
        frame = row * height
        frames.append(chunk(b"00db", frame))
        index.append(struct.pack("<4sIII", b"00db", 0x10, offset, len(frame)))
        offset += 8 + len(frame) + len(frame) % 2
    data = b"AVI " + header + chunk(b"LIST", b"movi" + b"".join(frames)) + chunk(b"idx1", b"".join(index))
    return b"RIFF" + struct.pack("<I", len(data)) + data


class LocalSuite:
    def __init__(self, root):
        self.root = root.resolve()
        self.repo = pathlib.Path(__file__).resolve().parents[3]
        self.run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + uuid.uuid4().hex[:8]
        self.db = "supabase_db_" + PROJECT
        self.anon = self.service = self.jwt_secret = None
        self.actors = {}
        self.labels = [str(uuid.uuid4()), str(uuid.uuid4())]
        self.contributions = {}
        self.created_policy = None
        self.policy_id = None
        self.before_fingerprint = None
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
        self.report = {"run_id": self.run_id, "started_at": datetime.now(timezone.utc).isoformat(),
                       "api_url": API, "project_root": str(self.root), "checks": [],
                       "fixtures": {}, "cleanup": {},
                       "scope": "Local Auth/PostgREST/Storage integration; no migration or schema modifications"}

    def check(self, case, condition, **evidence):
        status = "PASS" if condition else "FAIL"
        item = {"scenario": case, "status": status, "evidence": evidence}
        self.report["checks"].append(item)
        print(status + " " + case + " " + json.dumps(evidence, sort_keys=True), flush=True)
        return bool(condition)

    def require(self, case, condition, **evidence):
        if not self.check(case, condition, **evidence):
            raise RuntimeError("Prerequisite failed: " + case)

    def docker(self, *args):
        result = subprocess.run(DOCKER + list(args), capture_output=True, text=True, timeout=30)
        if result.returncode:
            raise RuntimeError("Local Docker command failed")
        return result.stdout

    def inspect(self, name):
        return json.loads(self.docker("inspect", name))[0]

    def sql_process_args(self):
        return DOCKER + ["exec", "-i", self.db, "psql", "-U", "postgres", "-d", "postgres",
                         "-X", "-qAt", "-w", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose"]

    def sql(self, query):
        result = subprocess.run(self.sql_process_args(), input=query, capture_output=True, text=True, timeout=30)
        if result.returncode:
            # Do not echo SQL errors or input: later tests may contain sensitive values.
            state = re.search(r"ERROR:\s+([A-Z0-9]{5}):", result.stderr)
            raise RuntimeError("Local fixture SQL failed; SQLSTATE=" + (state.group(1) if state else "unavailable"))
        return result.stdout.strip()

    def sql_json(self, query):
        return json.loads(self.sql(query))

    @staticmethod
    def safe_response(response):
        body = response["json"]
        if not isinstance(body, dict):
            body = {}
        return {"http_status": response["status"],
                "error_code": body.get("code") or body.get("error_code") or body.get("error"),
                "api_status": body.get("statusCode")}

    def request(self, method, path, token=None, body=None, binary=None, apikey=True, content_type=None):
        url = urllib.parse.urljoin(API + "/", path.lstrip("/"))
        parsed = urllib.parse.urlsplit(url)
        if parsed.scheme != "http" or parsed.hostname != "127.0.0.1" or parsed.port != 55431 or parsed.username:
            raise RuntimeError("Non-local request rejected")
        headers = {}
        if apikey:
            headers["apikey"] = self.service if token == self.service else self.anon
        if token:
            headers["Authorization"] = "Bearer " + token
        data = None
        if body is not None:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
        if binary is not None:
            data = binary
            headers["Content-Type"] = content_type or "application/octet-stream"
        if method == "POST" and path.startswith("/rest/v1/dataset_contributions"):
            headers["Prefer"] = "return=representation"
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        # A separate opener/HTTP connection is used for every request, including races.
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
        try:
            with opener.open(req, timeout=15) as response:
                status, raw = response.status, response.read()
        except urllib.error.HTTPError as error:
            status, raw = error.code, error.read()
        try:
            decoded = json.loads(raw)
        except (ValueError, UnicodeError):
            decoded = None
        return {"status": status, "json": decoded, "raw": raw}

    def denied(self, case, response):
        return self.check(case, response["status"] in (400, 401, 403, 404),
                          **self.safe_response(response))

    def fingerprint(self):
        return self.sql("""
          select md5(string_agg(definition,E'\\n' order by kind,name))
          from (
            select 'policy' kind, schemaname||'.'||tablename||'.'||policyname name,
                   concat_ws('|',permissive,roles::text,cmd,qual,with_check) definition
            from pg_policies where policyname like 'dataset_%'
            union all
            select 'function', n.nspname||'.'||p.oid::text, pg_get_functiondef(p.oid)
            from pg_proc p join pg_namespace n on n.oid=p.pronamespace
            where n.nspname in ('public','private')
              and (p.proname like 'dataset_%' or p.proname='is_dataset_curator')
          ) source;
        """)

    def preflight(self):
        cfg = tomllib.loads((self.root / "supabase/config.toml").read_text())
        auth_cfg = cfg.get("auth", {})
        urls = [auth_cfg.get("site_url", "")] + auth_cfg.get("additional_redirect_urls", [])
        url_local = all(urllib.parse.urlsplit(url).hostname in ("127.0.0.1", "localhost", "::1") for url in urls)
        self.require("ENV-01 local project and endpoints",
                     cfg.get("project_id") == PROJECT and cfg["api"]["port"] == 55431
                     and cfg["db"]["port"] == 55432 and cfg["db"]["major_version"] == 15
                     and url_local
                     and not any(v.get("enabled") for v in auth_cfg.get("external", {}).values() if isinstance(v, dict)),
                     project_id=cfg.get("project_id"), configured_pg_major=cfg["db"]["major_version"],
                     api_port=cfg["api"]["port"], db_port=cfg["db"]["port"],
                     auth_redirects_local=url_local, external_oauth_enabled=False)
        network = json.loads(self.docker("network", "inspect", NETWORK))[0]
        self.require("ENV-02 dedicated local Docker network",
                     network["Driver"] == "bridge"
                     and network.get("Options", {}).get("com.docker.network.bridge.host_binding_ipv4") == "127.0.0.1",
                     network=NETWORK, default_host_binding=network.get("Options", {}).get("com.docker.network.bridge.host_binding_ipv4"))
        bindings = {}
        for service in ("db", "kong", "studio", "auth", "storage"):
            container = self.inspect("supabase_" + service + "_" + PROJECT)
            if container["Config"].get("Labels", {}).get("com.supabase.cli.project") != PROJECT:
                raise RuntimeError("Container project mismatch")
            if list(container["NetworkSettings"]["Networks"]) != [NETWORK]:
                raise RuntimeError("Container network mismatch")
            for port, rows in (container["NetworkSettings"].get("Ports") or {}).items():
                for binding in rows or []:
                    if binding["HostIp"] not in ("127.0.0.1", "::1"):
                        raise RuntimeError("Non-loopback published port rejected")
                    bindings[service + ":" + port] = {"host_ip": binding["HostIp"], "port": binding["HostPort"]}
        self.check("ENV-03 published endpoints are loopback only", True, bindings=bindings)
        hashes = {}
        for migration in sorted((self.repo / "supabase/migrations").glob("*.sql")):
            counterpart = self.root / "supabase/migrations" / migration.name
            self.require("ENV-04 migration copy " + migration.name,
                         counterpart.is_file() and migration.read_bytes() == counterpart.read_bytes(),
                         sha256=hashlib.sha256(migration.read_bytes()).hexdigest())
            hashes[migration.name] = hashlib.sha256(migration.read_bytes()).hexdigest()
        self.report["migration_sha256"] = hashes
        version = self.sql("select current_setting('server_version');")
        self.require("ENV-05 actual PostgreSQL version", version.startswith("15."),
                     server_version=version, connection="docker exec / local Unix socket inside isolated DB container")
        self.report["postgres_version"] = version
        studio = self.inspect("supabase_studio_" + PROJECT)
        env = dict(s.split("=", 1) for s in studio["Config"]["Env"] if "=" in s)
        self.anon, self.service = env["SUPABASE_ANON_KEY"], env["SUPABASE_SERVICE_KEY"]
        auth = self.inspect("supabase_auth_" + PROJECT)
        env_auth = dict(s.split("=", 1) for s in auth["Config"]["Env"] if "=" in s)
        self.jwt_secret = env_auth["GOTRUE_JWT_SECRET"]
        key_checks = []
        for key, role in ((self.anon, "anon"), (self.service, "service_role")):
            parts = key.split(".")
            payload = jwt_part(parts[1])
            signature = b64url(hmac.new(self.jwt_secret.encode(), ".".join(parts[:2]).encode(), hashlib.sha256).digest())
            key_checks.append(jwt_part(parts[0]).get("alg") == "HS256"
                              and payload.get("role") == role and hmac.compare_digest(signature, parts[2]))
        self.require("ENV-06 credentials originate from local stack", all(key_checks),
                     source="Local Studio container keys; signatures checked against local Auth JWT secret",
                     credential_values_logged=False)
        buckets = self.sql_json("select json_agg(json_build_object('id',id,'public',public)) from storage.buckets where id in ('dataset-contribution-videos','dataset-export-archives');")
        self.require("ENV-07 dataset buckets private", len(buckets or []) == 2 and all(not b["public"] for b in buckets),
                     buckets=buckets)
        for path in ("/auth/v1/health", "/storage/v1/status"):
            response = self.request("GET", path)
            self.require("ENV-08 health " + path, response["status"] == 200, **self.safe_response(response))
        self.before_fingerprint = self.fingerprint()

    def create_accounts(self):
        for alias in ("contributor_a", "contributor_b", "technical_admin", "curator_a", "curator_b"):
            email = "signify-it-" + self.run_id.lower() + "-" + alias + "@example.test"
            password = secrets.token_urlsafe(32)
            response = self.request("POST", "/auth/v1/admin/users", self.service,
                                    {"email": email, "password": password, "email_confirm": True,
                                     "user_metadata": {"display_name": "Synthetic " + alias, "signify_test_run": self.run_id}})
            self.require("AUTH-01 create local " + alias, response["status"] in (200, 201)
                         and isinstance(response["json"], dict) and bool(response["json"].get("id")),
                         **self.safe_response(response))
            actor_id = str(uuid.UUID(response["json"]["id"]))
            login = self.request("POST", "/auth/v1/token?grant_type=password",
                                 body={"email": email, "password": password})
            self.require("AUTH-02 password login " + alias, login["status"] == 200
                         and isinstance(login["json"], dict) and bool(login["json"].get("access_token")),
                         **self.safe_response(login))
            self.actors[alias] = {"id": actor_id, "token": login["json"]["access_token"]}
            current = self.request("GET", "/auth/v1/user", self.actors[alias]["token"])
            self.require("AUTH-03 validated Auth session " + alias,
                         current["status"] == 200 and current["json"].get("id") == actor_id,
                         actor_id=actor_id, **self.safe_response(current))
        ids = ",".join(literal(a["id"]) for a in self.actors.values())
        profiles = self.sql_json("select json_agg(json_build_object('id',user_id,'role',role)) from public.profiles where user_id in (" + ids + ");")
        self.require("AUTH-04 existing trigger creates profiles",
                     len(profiles or []) == 5 and all(p["role"] == "user" for p in profiles), profile_count=len(profiles or []))
        self.report["fixtures"]["actors"] = {name: actor["id"] for name, actor in self.actors.items()}
        admins = ",".join(literal(self.actors[k]["id"]) for k in ("technical_admin",))
        self.sql("update public.profiles set role='admin' where user_id in (" + admins + ");")
        for name in ("curator_a", "curator_b"):
            self.sql("insert into private.dataset_curator_grants(user_id,granted_by,qualification_note) values ("
                     + literal(self.actors[name]["id"]) + "," + literal(self.actors["technical_admin"]["id"]) + ","
                     + literal("Synthetic integration fixture " + self.run_id + "; not real competence certification") + ");")

    def seed_data(self):
        for idx, label_id in enumerate(self.labels):
            self.sql("insert into public.dataset_labels(id,code,display_name,created_by) values ("
                     + literal(label_id) + "," + literal("it_" + self.run_id.replace("-", "_").lower() + "_" + str(idx))
                     + "," + literal("Synthetic integration label " + str(idx))
                     + "," + literal(self.actors["technical_admin"]["id"]) + ");")
        self.video = synthetic_avi()
        self.video_hash = hashlib.sha256(self.video).hexdigest()
        policies = self.sql_json("select coalesce(json_agg(p),'[]'::json) from public.dataset_video_policies p where is_active;")
        if policies:
            # Never deactivate or replace an existing active policy to make a fixture pass.
            p = policies[0]
            self.require("FIXTURE existing active policy accepts synthetic AVI",
                         p["min_duration_ms"] <= 200 <= p["max_duration_ms"]
                         and p["min_short_side_px"] <= 48 and p["max_long_side_px"] >= 64
                         and p["max_size_bytes"] >= len(self.video) and "video/x-msvideo" in p["allowed_mime_types"],
                         existing_policy_preserved=True)
            self.policy_id = p["id"]
        else:
            self.created_policy = self.policy_id = str(uuid.uuid4())
            self.sql("insert into public.dataset_video_policies(id,version,min_duration_ms,max_duration_ms,"
                     "min_short_side_px,max_long_side_px,max_size_bytes,allowed_mime_types,is_active,created_by,approved_at) values ("
                     + literal(self.policy_id) + "," + literal("synthetic-integration-" + self.run_id)
                     + ",1,10000,16,1024,1048576,array['video/x-msvideo'],true,"
                     + literal(self.actors["technical_admin"]["id"]) + ",now());")
        now = datetime.now(timezone.utc).isoformat()
        for alias, owner in (("video_a", "contributor_a"), ("video_b", "contributor_b"),
                             ("http_race", "contributor_a"), ("sql_race", "contributor_a")):
            cid, owner_id = str(uuid.uuid4()), self.actors[owner]["id"]
            item = {"id": cid, "user_id": owner_id, "proposed_label_id": self.labels[0],
                    "recognition_event_id": None, "video_object_path": owner_id + "/" + cid + "/video",
                    "size_bytes": len(self.video), "duration_ms": 200, "width": 64, "height": 48, "fps": 10,
                    "mime_type": "video/x-msvideo", "container": "avi", "codec": "rawvideo",
                    "source_sha256": self.video_hash, "video_policy_id": self.policy_id,
                    "validated_at": now, "consent_version": "synthetic-test-consent-" + self.run_id,
                    "consented_at": now, "signer_pseudonym": "synthetic-" + owner}
            response = self.request("POST", "/rest/v1/dataset_contributions", self.service, item)
            self.require("FIXTURE trusted ingestion " + alias, response["status"] == 201,
                         **self.safe_response(response))
            self.contributions[alias] = item
        self.report["fixtures"].update({"contributions": {k: v["id"] for k, v in self.contributions.items()},
                                        "video_policy_id": self.policy_id, "label_ids": self.labels,
                                        "video": {"type": "synthetic two-frame RGB AVI", "bytes": len(self.video),
                                                  "sha256": self.video_hash, "not_backend_decode_test": True}})
        for alias in ("video_a", "video_b"):
            response = self.request("POST", self.object_path(alias), self.service,
                                    binary=self.video, content_type="video/x-msvideo")
            self.require("STORAGE-01 trusted upload " + alias, response["status"] in (200, 201),
                         bytes=len(self.video), **self.safe_response(response))

    def object_path(self, alias, operation=""):
        suffix = self.contributions[alias]["video_object_path"]
        return "/storage/v1/object/" + operation + BUCKET + "/" + suffix

    def list_contributions(self, actor, cid=None):
        ids = ",".join(c["id"] for c in self.contributions.values())
        query = {"select": "id,user_id,status,final_label_id,revision",
                 "id": "eq." + cid if cid else "in.(" + ids + ")"}
        return self.request("GET", "/rest/v1/dataset_contributions?" + urllib.parse.urlencode(query), actor["token"])

    def review(self, actor, alias, label=None):
        return self.request("POST", "/rest/v1/rpc/dataset_review_contribution", actor["token"],
                            {"p_contribution_id": self.contributions[alias]["id"], "p_expected_revision": 1,
                             "p_decision": "APPROVED", "p_final_label_id": label or self.labels[0]})

    def data_tests(self):
        for alias, count in (("contributor_a", 3), ("contributor_b", 1), ("technical_admin", 0),
                             ("curator_a", 4), ("curator_b", 4)):
            response = self.list_contributions(self.actors[alias])
            actual = len(response["json"]) if isinstance(response["json"], list) else None
            self.check("RLS-01 contribution visibility " + alias,
                       response["status"] == 200 and actual == count,
                       expected_rows=count, visible_rows=actual, **self.safe_response(response))
        for actor, target in (("contributor_a", "video_b"), ("contributor_b", "video_a")):
            response = self.list_contributions(self.actors[actor], self.contributions[target]["id"])
            self.check("RLS-02 guessed ID " + actor, response["status"] == 200 and response["json"] == [],
                       visible_rows=len(response["json"]) if isinstance(response["json"], list) else None,
                       **self.safe_response(response))
        a = self.actors["contributor_a"]
        response = self.request("PATCH", "/rest/v1/profiles?user_id=eq." + a["id"], a["token"], {"role": "admin"})
        self.check("RLS-03 user cannot promote own role",
                   response["status"] == 403 and response["json"].get("code") == "42501",
                   **self.safe_response(response))
        response = self.request("PATCH", "/rest/v1/dataset_contributions?id=eq." + self.contributions["video_a"]["id"],
                                a["token"], {"status": "APPROVED", "final_label_id": self.labels[0]})
        self.check("RLS-04 direct self approval forbidden",
                   response["status"] == 403 and response["json"].get("code") == "42501",
                   **self.safe_response(response))
        for actor in ("contributor_a", "technical_admin"):
            response = self.review(self.actors[actor], "video_a")
            self.check("CURATION-01 unauthorized decision " + actor,
                       response["status"] == 403 and response["json"].get("code") == "42501",
                       **self.safe_response(response))
        attempted = dict(self.contributions["video_a"])
        attempted["id"] = str(uuid.uuid4())
        attempted["video_object_path"] = a["id"] + "/" + attempted["id"] + "/video"
        response = self.request("POST", "/rest/v1/dataset_contributions", a["token"], attempted)
        self.check("RLS-05 browser cannot forge trusted validation metadata",
                   response["status"] == 403 and response["json"].get("code") == "42501",
                   **self.safe_response(response))

    def storage_tests(self):
        for actor, target in (("contributor_a", "video_a"), ("contributor_b", "video_b"),
                              ("curator_a", "video_a"), ("curator_b", "video_b")):
            response = self.request("GET", self.object_path(target), self.actors[actor]["token"])
            self.check("STORAGE-02 authorized read " + actor,
                       response["status"] == 200 and hashlib.sha256(response["raw"]).hexdigest() == self.video_hash,
                       content_hash_matches=hashlib.sha256(response["raw"]).hexdigest() == self.video_hash,
                       **self.safe_response(response))
        for actor in ("contributor_b", "technical_admin"):
            self.denied("STORAGE-03 unauthorized video read " + actor,
                        self.request("GET", self.object_path("video_a"), self.actors[actor]["token"]))
        self.denied("STORAGE-04 anonymous API-key-only read",
                    self.request("GET", self.object_path("video_a")))
        self.denied("STORAGE-05 request without credentials",
                    self.request("GET", self.object_path("video_a"), apikey=False))
        self.denied("STORAGE-06 public object route must not expose private video",
                    self.request("GET", self.object_path("video_a", "public/"), apikey=False))
        for actor, target, expected in (("contributor_a", "video_a", 1), ("contributor_a", "video_b", 0)):
            prefix = self.contributions[target]["video_object_path"].rsplit("/", 1)[0]
            response = self.request("POST", "/storage/v1/object/list/" + BUCKET, self.actors[actor]["token"],
                                    {"prefix": prefix, "limit": 100, "offset": 0})
            names = [v.get("name") for v in response["json"]] if isinstance(response["json"], list) else None
            self.check("STORAGE-07 list " + actor + " " + target,
                       response["status"] == 200 and len(names) == expected,
                       listed_count=len(names) if names is not None else None, **self.safe_response(response))
        a = self.actors["contributor_a"]
        fresh = "/storage/v1/object/" + BUCKET + "/" + a["id"] + "/" + str(uuid.uuid4()) + "/video"
        response = self.request("POST", fresh, a["token"], binary=self.video, content_type="video/x-msvideo")
        self.denied("STORAGE-08 direct browser upload rejected", response)
        count = self.sql("select count(*) from storage.objects where bucket_id=" + literal(BUCKET)
                         + " and name=" + literal(fresh.split(BUCKET + "/", 1)[1]) + ";")
        self.check("STORAGE-09 rejected upload leaves no object", count == "0", storage_rows=int(count))
        response = self.request("PUT", self.object_path("video_a"), a["token"],
                                binary=b"unauthorized replacement", content_type="video/x-msvideo")
        self.denied("STORAGE-10 contributor cannot overwrite source", response)
        unchanged = self.request("GET", self.object_path("video_a"), a["token"])
        self.check("STORAGE-11 source bytes unchanged after denied overwrite",
                   unchanged["status"] == 200 and hashlib.sha256(unchanged["raw"]).hexdigest() == self.video_hash,
                   **self.safe_response(unchanged))

    def signed_url(self, response):
        body = response["json"] or {}
        signed = body.get("signedURL") or body.get("signedUrl")
        if not signed:
            return None
        if signed.startswith("/object/"):
            return "/storage/v1" + signed
        parsed = urllib.parse.urlsplit(urllib.parse.urljoin(API + "/", signed))
        if parsed.scheme != "http" or parsed.hostname != "127.0.0.1" or parsed.port != 55431:
            raise RuntimeError("Non-local signed URL rejected")
        return urllib.parse.urlunsplit(("", "", parsed.path, parsed.query, ""))

    def signed_url_tests(self):
        for actor in ("contributor_a", "curator_a"):
            response = self.request("POST", self.object_path("video_a", "sign/"), self.actors[actor]["token"],
                                    {"expiresIn": 30})
            path = self.signed_url(response) if response["status"] == 200 else None
            self.check("SIGN-01 authorized signed URL " + actor, response["status"] == 200 and bool(path),
                       signed_url_returned=bool(path), **self.safe_response(response))
            if path:
                download = self.request("GET", path, apikey=False)
                self.check("SIGN-02 issued URL downloads expected bytes " + actor,
                           download["status"] == 200 and hashlib.sha256(download["raw"]).hexdigest() == self.video_hash,
                           capability_url_expected_without_auth=True, query_token_logged=False,
                           **self.safe_response(download))
        for actor in ("contributor_b", "technical_admin"):
            response = self.request("POST", self.object_path("video_a", "sign/"), self.actors[actor]["token"],
                                    {"expiresIn": 30})
            self.check("SIGN-03 unauthorized signing " + actor,
                       response["status"] in (400, 401, 403, 404) and not self.signed_url(response),
                       signed_url_returned=bool(self.signed_url(response)), **self.safe_response(response))
        response = self.request("POST", self.object_path("video_a", "sign/"), body={"expiresIn": 30})
        self.check("SIGN-04 anonymous signing denied",
                   response["status"] in (400, 401, 403, 404) and not self.signed_url(response),
                   **self.safe_response(response))
        response = self.request("POST", self.object_path("video_a", "sign/"),
                                self.actors["contributor_a"]["token"], {"expiresIn": 1})
        path = self.signed_url(response) if response["status"] == 200 else None
        if not path:
            self.check("SIGN-05 expiring URL prerequisite", False, **self.safe_response(response))
            return
        first = self.request("GET", path, apikey=False)
        time.sleep(3)
        expired = self.request("GET", path, apikey=False)
        self.check("SIGN-05 signed URL expires",
                   first["status"] == 200 and expired["status"] in (400, 401, 403, 404),
                   before_expiry_http=first["status"], after_expiry_http=expired["status"],
                   query_token_logged=False)

    def auth_negative_tests(self):
        self.denied("AUTH-05 missing user token", self.request("GET", "/auth/v1/user"))
        invalid = "definitely-not-a-valid-local-jwt"
        self.denied("AUTH-06 invalid JWT rejected by Auth",
                    self.request("GET", "/auth/v1/user", invalid))
        self.denied("AUTH-07 invalid JWT rejected by Storage",
                    self.request("GET", self.object_path("video_a"), invalid))
        self.denied("AUTH-08 invalid JWT rejected by PostgREST",
                    self.request("GET", "/rest/v1/dataset_contributions?select=id&limit=0", invalid))
        original = self.actors["contributor_a"]["token"].split(".")
        claims = jwt_part(original[1])

        def token(exp):
            data = dict(claims)
            data.update({"iat": int(time.time()) - 3600, "exp": exp})
            unsigned = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()) + "." + b64url(json.dumps(data).encode())
            return unsigned + "." + b64url(hmac.new(self.jwt_secret.encode(), unsigned.encode(), hashlib.sha256).digest())

        control = token(int(time.time()) + 300)
        expired = token(int(time.time()) - 600)
        positive = self.request("GET", "/auth/v1/user", control)
        self.require("AUTH-09 local signing key positive control",
                     positive["status"] == 200 and positive["json"].get("id") == self.actors["contributor_a"]["id"],
                     **self.safe_response(positive))
        for title, path in (("Auth", "/auth/v1/user"), ("Storage", self.object_path("video_a")),
                            ("PostgREST", "/rest/v1/dataset_contributions?select=id&limit=0")):
            response = self.request("GET", path, expired)
            self.denied("AUTH-10 correctly signed expired JWT rejected by " + title, response)
        response = self.request("POST", self.object_path("video_a", "sign/"), expired, {"expiresIn": 30})
        self.check("AUTH-11 expired JWT cannot mint signed URL",
                   response["status"] in (400, 401, 403, 404) and not self.signed_url(response),
                   **self.safe_response(response))

    def race_state(self, alias):
        cid = literal(self.contributions[alias]["id"])
        return self.sql_json("select json_build_object('revision',c.revision,'status',c.status,"
                             "'reviews',(select count(*) from public.dataset_curation_reviews r where r.contribution_id=c.id),"
                             "'notifications',(select count(*) from public.dataset_notifications n where n.contribution_id=c.id))"
                             " from public.dataset_contributions c where id=" + cid + ";")

    def concurrency_tests(self):
        barrier = threading.Barrier(2)

        def compete(index):
            barrier.wait(timeout=5)
            return self.review(self.actors[("curator_a", "curator_b")[index]], "http_race", self.labels[index])

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            futures = [pool.submit(compete, i) for i in range(2)]
            responses = [f.result(timeout=20) for f in futures]
        state = self.race_state("http_race")
        self.check("RACE-01 independent HTTP curator requests",
                   sorted(r["status"] for r in responses) == [200, 409]
                   and any(isinstance(r["json"], dict) and r["json"].get("code") == "40001" for r in responses)
                   and state == {"revision": 2, "status": "APPROVED", "reviews": 1, "notifications": 1},
                   responses=[self.safe_response(r) for r in responses], state=state)

        def session_sql(actor, label, name, hold=False):
            claims = json.dumps({"sub": self.actors[actor]["id"], "role": "authenticated"})
            call = "select public.dataset_review_contribution(" + literal(self.contributions["sql_race"]["id"])
            call += ",1,'APPROVED'," + literal(label) + ",null);"
            return ("select 'PID_" + name + "='||pg_backend_pid();\nbegin;\nset local role authenticated;\n"
                    "do $claims$ begin perform set_config('request.jwt.claims'," + literal(claims)
                    + ",true); end $claims$;\n" + call
                    + ("\nselect 'LOCK_HELD';\nselect pg_sleep(4);" if hold else "") + "\ncommit;\n")

        first = subprocess.Popen(self.sql_process_args(), stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                 stderr=subprocess.PIPE, text=True, bufsize=1)
        first.stdin.write(session_sql("curator_a", self.labels[0], "A", True))
        first.stdin.close()
        pid_a = None
        while True:
            line = first.stdout.readline()
            if not line:
                raise RuntimeError("First independent SQL session did not acquire its lock")
            if line.startswith("PID_A="):
                pid_a = int(line.strip().split("=")[1])
            if line.strip() == "LOCK_HELD":
                break
        second = subprocess.Popen(self.sql_process_args(), stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE, text=True, bufsize=1)
        second.stdin.write(session_sql("curator_b", self.labels[1], "B"))
        second.stdin.close()
        line = second.stdout.readline()
        pid_b = int(line.strip().split("=")[1]) if line.startswith("PID_B=") else None
        waiting = self.sql("select coalesce(bool_or(wait_event_type='Lock'),false) from pg_stat_activity where pid="
                           + str(pid_b or 0) + ";")
        first.wait(timeout=15)
        second.wait(timeout=15)
        stderr_b = second.stderr.read()
        state = self.race_state("sql_race")
        self.check("RACE-02 independent PostgreSQL connections serialize curation",
                   pid_a is not None and pid_b is not None and pid_a != pid_b
                   and waiting == "t" and first.returncode == 0 and second.returncode != 0
                   and "40001" in stderr_b
                   and state == {"revision": 2, "status": "APPROVED", "reviews": 1, "notifications": 1},
                   backend_pid_a=pid_a, backend_pid_b=pid_b, blocked_on_row_lock=waiting == "t",
                   winner_exit_code=first.returncode, stale_request_sqlstate="40001" if "40001" in stderr_b else None,
                   state=state)

    def cleanup(self):
        # Do not delete persistent audit records or disable any protections.
        # Only revoke/deactivate grants/configuration created by this run.
        for name in ("curator_a", "curator_b"):
            if name in self.actors:
                self.sql("update private.dataset_curator_grants set revoked_at=now() where user_id="
                         + literal(self.actors[name]["id"]) + " and qualification_note like "
                         + literal("%" + self.run_id + "%") + ";")
        if self.created_policy:
            self.sql("update public.dataset_video_policies set is_active=false where id="
                     + literal(self.created_policy) + " and version=" + literal("synthetic-integration-" + self.run_id) + ";")
        if self.actors:
            self.sql("update public.dataset_labels set is_active=false where id in ("
                     + ",".join(literal(i) for i in self.labels) + ") and code like "
                     + literal("it_" + self.run_id.replace("-", "_").lower() + "%") + ";")
        self.report["cleanup"] = {"temporary_curator_grants_revoked": True,
                                  "own_synthetic_video_policy_deactivated": bool(self.created_policy),
                                  "own_synthetic_labels_deactivated": True,
                                  "fixture_accounts_contributions_audit_and_objects_retained": True,
                                  "existing_rows_deleted": False}
        if self.before_fingerprint:
            self.check("ENV-09 RLS and database function definitions unchanged",
                       self.before_fingerprint == self.fingerprint(),
                       before=self.before_fingerprint, after=self.fingerprint())
        unchanged = all((self.repo / "supabase/migrations" / name).is_file()
                        and hashlib.sha256((self.repo / "supabase/migrations" / name).read_bytes()).hexdigest() == digest
                        for name, digest in self.report.get("migration_sha256", {}).items())
        self.check("ENV-10 migration files unchanged", unchanged)

    def save_report(self):
        self.report["finished_at"] = datetime.now(timezone.utc).isoformat()
        self.report["summary"] = {status.lower(): sum(c["status"] == status for c in self.report["checks"])
                                  for status in ("PASS", "FAIL")}
        self.report["limitations"] = [
            "No recorder, FastAPI ingestion, or backend media decoding implementation is exercised.",
            "Synthetic AVI bytes are used only for Storage authorization and checksum checks.",
            "Signed URLs are bearer capabilities: possession permits access until expiry.",
            "Existing database rows and all migration/RLS definitions are preserved.",
            "Fixture rows/objects are retained with run_id references; temporary curator grants are revoked.",
        ]
        target_dir = pathlib.Path(__file__).resolve().parent / "results"
        target_dir.mkdir(exist_ok=True)
        target = target_dir / ("auth-storage-" + self.run_id + ".json")
        with target.open("x", encoding="utf-8") as handle:
            json.dump(self.report, handle, indent=2, sort_keys=True)
            handle.write("\n")
        print("REPORT " + str(target), flush=True)
        print("SUMMARY " + json.dumps(self.report["summary"]), flush=True)
        return 1 if self.report["summary"]["fail"] or self.report.get("fatal") else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-root", type=pathlib.Path, default=pathlib.Path("/home/bunga/signify-supabase-local"))
    parser.add_argument("--allow-local-fixtures", action="store_true", required=True,
                        help="Explicitly permit creating synthetic local accounts/data, never schema changes.")
    args = parser.parse_args()
    suite = LocalSuite(args.project_root)
    try:
        suite.preflight()
        suite.create_accounts()
        suite.seed_data()
        suite.data_tests()
        suite.storage_tests()
        suite.signed_url_tests()
        suite.auth_negative_tests()
        suite.concurrency_tests()
    except Exception as error:
        # Do not include exception strings/tracebacks that might contain a signed URL or secret.
        suite.report["fatal"] = {"type": type(error).__name__, "stage": "after " + str(len(suite.report["checks"])) + " checks"}
        print("ABORTED " + type(error).__name__ + "; sensitive details suppressed", flush=True)
    finally:
        if suite.before_fingerprint:
            try:
                suite.cleanup()
            except Exception as error:
                suite.report["cleanup_error"] = {"type": type(error).__name__}
                suite.check("CLEANUP temporary fixture privileges revoked", False, error_type=type(error).__name__)
    return suite.save_report()


if __name__ == "__main__":
    sys.exit(main())
