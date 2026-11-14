#!/usr/bin/env python3
"""Approval-gated local pilot configuration. Default plan is read-only; no migrations."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from uuid import UUID, NAMESPACE_URL, uuid5
from zipfile import ZipFile
import xml.etree.ElementTree as ET

REPO = Path(__file__).resolve().parents[2]
MANIFEST = REPO / "supabase/pilot/dataset-pilot.local.json"
ENV = REPO / "apps/frontend/.env.local"
MANAGED = ("NEXT_PUBLIC_DATASET_CONSENT_VERSION", "NEXT_PUBLIC_DATASET_CONSENT_TEXT")


class PilotError(Exception):
    pass


def require(condition, code):
    if not condition:
        raise PilotError(code)


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def literal(value):
    require("\x00" not in value, "invalid_sql_value")
    return "'" + value.replace("'", "''") + "'"


def load_manifest(path=MANIFEST, root=REPO):
    data = json.loads(path.read_text(encoding="utf-8"))
    require(data.get("local_only") is True and data.get("stage") == "DRAFT_AWAITING_USER_APPROVAL", "not_local_draft")
    require(re.fullmatch(r"[a-z0-9-]{8,80}", data["pilot_id"]), "invalid_pilot_id")
    policy = data["policy"]
    fields = {"version", "min_duration_ms", "max_duration_ms", "min_short_side_px",
              "max_long_side_px", "max_size_bytes", "allowed_mime_types"}
    require(set(policy) == fields, "unexpected_policy_fields")
    require(policy["version"].startswith("dev-local-"), "version_must_identify_local_pilot")
    for key in fields - {"version", "allowed_mime_types"}:
        require(type(policy[key]) is int and policy[key] > 0, "invalid_policy_number")
    require(policy["min_duration_ms"] < policy["max_duration_ms"], "invalid_duration_range")
    require(policy["min_duration_ms"] == 3000 and policy["max_duration_ms"] == 7000,
            "recording_duration_must_be_3_7_seconds")
    require(policy["min_short_side_px"] <= policy["max_long_side_px"], "invalid_resolution_range")
    require(bool(policy["allowed_mime_types"]) and len(set(policy["allowed_mime_types"])) == len(policy["allowed_mime_types"])
            and set(policy["allowed_mime_types"]) <= {"video/webm", "video/mp4"}, "unsupported_pilot_container")
    consent = data["consent"]
    require(0 < len(consent["version"]) <= 100 and consent["version"].startswith("dev-local-consent-draft-"), "invalid_consent_version")
    require(consent["text"].startswith("DRAF PERSETUJUAN UJI LOKAL") and "$" not in consent["text"]
            and "\x00" not in consent["text"], "invalid_draft_consent")
    source = data["source"]
    file = (root / source["path"]).resolve()
    require(file.is_relative_to(root.resolve()) and file.suffix == ".docx", "source_outside_repository")
    require(file.is_file(), "proposal_source_missing")
    require(hashlib.sha256(file.read_bytes()).hexdigest() == source["sha256"], "proposal_source_changed_reaudit_required")
    with ZipFile(file) as archive:
        require(archive.getinfo("word/document.xml").file_size < 8 * 1024 * 1024, "proposal_xml_too_large")
        document = ET.fromstring(archive.read("word/document.xml"))
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    paragraphs = [" ".join(" ".join(t.text or "" for t in p.findall(".//w:t", ns)).split())
                  for p in document.findall(".//w:p", ns)]
    matches = [p for p in paragraphs if source["anchor"] in p]
    require(len(matches) == 1, "proposal_inventory_anchor_missing_or_ambiguous")
    text = matches[0].split(source["anchor"], 1)[1].split(". Penamaan", 1)[0].strip().rstrip(".")
    inventory = [re.sub(r"^dan\s+", "", name.strip()) for name in text.split(",")]
    require(len(inventory) == 40, "proposal_inventory_count_changed")
    labels = data["labels"]
    require(bool(labels) and len({label["code"] for label in labels}) == len(labels), "duplicate_or_empty_labels")
    for label in labels:
        require(set(label) == {"code", "display_name"} and label["display_name"] in inventory, "label_not_in_proposal")
        require(label["code"] == label["display_name"].lower().replace(" ", "_")
                and re.fullmatch(r"[a-z0-9]+(_[a-z0-9]+)*", label["code"]), "invalid_label_mapping")
    return data


def specs(data, actor):
    actor = str(UUID(actor))
    base = "signify-ai/local/" + data["pilot_id"]
    policy = {**data["policy"], "id": str(uuid5(NAMESPACE_URL, base + "/policy/" + data["policy"]["version"])),
              "created_by": actor}
    description = "LOCAL DEVELOPMENT PILOT; source proposal section 3.1.1; catalog only, not semantic curation."
    labels = [{**label, "id": str(uuid5(NAMESPACE_URL, base + "/label/" + label["code"])),
               "description": description, "created_by": actor} for label in data["labels"]]
    return {"policy": policy, "labels": labels}


def authorize(data, approval, actor, offline=False):
    require(not offline, "offline_mode_cannot_write")
    require(approval == digest(data), "explicit_matching_approval_digest_required")
    try:
        UUID(actor or "")
    except (ValueError, TypeError):
        raise PilotError("existing_local_admin_profile_uuid_required") from None


def parse_env(text):
    result = {}
    for line in text.splitlines():
        match = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)=(.*)$", line)
        if not match:
            continue
        key, raw = match.groups()
        require(key not in result, "duplicate_environment_key")
        raw = raw.strip()
        if raw.startswith('"'):
            try:
                value = json.loads(raw)
            except ValueError:
                raise PilotError("invalid_quoted_environment_value") from None
        else:
            value = raw.strip("'")
        result[key] = value
    return result


def consent_lines(text):
    return {key: next((line for line in text.splitlines() if line.startswith(key + "=")), None) for key in MANAGED}


def patch_consent(text, lines):
    output = [line for line in text.splitlines() if not any(line.startswith(key + "=") for key in MANAGED)]
    output.extend(lines[key] for key in MANAGED if lines[key] is not None)
    return "\n".join(output) + "\n"


def desired_lines(data):
    return dict(zip(MANAGED, [MANAGED[0] + "=" + json.dumps(data["consent"]["version"]),
                              MANAGED[1] + "=" + json.dumps(data["consent"]["text"], ensure_ascii=False)]))


def connect():
    # Reuse the audited local-only fixture helper's READ-ONLY preflight, never
    # create_accounts()/seed_data()/cleanup(). Docker uses its explicit local socket.
    path = REPO / "supabase/tests/integration/test_auth_storage_local.py"
    spec = importlib.util.spec_from_file_location("dataset_pilot_preflight", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    stack = module.LocalSuite(Path("/home/bunga/signify-supabase-local"))
    stack.preflight()
    text = ENV.read_text(encoding="utf-8")
    env = parse_env(text)
    require(env.get("NEXT_PUBLIC_SUPABASE_URL") == "http://127.0.0.1:55431"
            and env.get("NEXT_PUBLIC_DATASET_API_URL") == "http://127.0.0.1:8001"
            and env.get("NEXT_PUBLIC_DATASET_LOCAL") == "true", "frontend_is_not_local")
    require(env.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") == stack.anon, "frontend_key_not_from_local_stack")
    require(not ENV.is_symlink(), "environment_symlink_rejected")
    return stack


def snapshot(stack, data, actor=None):
    actor_sql = "null" if actor is None else (
        "exists(select 1 from public.profiles where user_id=" + literal(str(UUID(actor))) + "::uuid and role='admin')")
    ids = specs(data, actor or "00000000-0000-0000-0000-000000000000")
    codes = ",".join(literal(label["code"]) for label in ids["labels"])
    query = """select json_build_object(
      'active_policies',(select coalesce(json_agg(p),'[]'::json) from public.dataset_video_policies p where is_active),
      'policies',(select coalesce(json_agg(p),'[]'::json) from public.dataset_video_policies p where id=%s::uuid or version=%s),
      'labels',(select coalesce(json_agg(l),'[]'::json) from public.dataset_labels l where code in (%s)),
      'actor_is_local_admin',%s,
      'columns',(select json_agg(c) from (select table_name,column_name,data_type,is_nullable
        from information_schema.columns where table_schema='public'
        and table_name in ('dataset_video_policies','dataset_labels') order by table_name,ordinal_position) c),
      'pilot_contributions',(select count(*) from public.dataset_contributions where video_policy_id=%s::uuid));"""
    return stack.sql_json("begin transaction read only;\n" + query %
                          (literal(ids["policy"]["id"]), literal(data["policy"]["version"]), codes, actor_sql,
                           literal(ids["policy"]["id"])) + "\nrollback;")


def check_snapshot(state, desired, actor_required=True):
    pid = desired["policy"]["id"]
    require(not any(p["id"] != pid for p in state["active_policies"]), "another_policy_is_active_preserved")
    if actor_required:
        require(state["actor_is_local_admin"] is True, "actor_must_be_existing_local_admin")
    for table, expected, ignored in (("policies", [desired["policy"]], {"is_active", "approved_at", "created_at"}),
                                     ("labels", desired["labels"], {"is_active", "created_at"})):
        by_id = {row["id"]: row for row in expected}
        for row in state[table]:
            require(row["id"] in by_id, "existing_catalog_or_version_collision_preserved")
            actual = {key: value for key, value in row.items() if key not in ignored}
            require(actual == by_id[row["id"]], "existing_pilot_snapshot_changed_use_new_version")


def mutation_sql(desired, active):
    # The same guards execute under locks in PostgreSQL, preventing a race between
    # the read-only preview and activation. Only these two configuration tables change.
    payload = canonical(desired)
    body = """declare
      spec jsonb := %s::jsonb;
      p jsonb := spec->'policy';
      item jsonb;
      existing jsonb;
    begin
      perform pg_advisory_xact_lock(hashtextextended('signify-dataset-local-pilot',0));
      lock table public.dataset_video_policies, public.dataset_labels in share row exclusive mode;
      if not exists(select 1 from public.profiles where user_id=(p->>'created_by')::uuid and role='admin') then
        raise exception 'Existing local admin profile required';
      end if;
      if exists(select 1 from public.dataset_video_policies where is_active and id<>(p->>'id')::uuid) then
        raise exception 'Other active policy preserved';
      end if;
      %s
      select to_jsonb(v)-array['is_active','approved_at','created_at'] into existing
        from public.dataset_video_policies v where id=(p->>'id')::uuid;
      if existing is distinct from p then raise exception 'Pilot policy mismatch'; end if;
      for item in select value from jsonb_array_elements(spec->'labels') loop
        %s
        select to_jsonb(v)-array['is_active','created_at'] into existing
          from public.dataset_labels v where id=(item->>'id')::uuid;
        if existing is distinct from item then raise exception 'Pilot label mismatch'; end if;
        update public.dataset_labels set is_active=%s where id=(item->>'id')::uuid;
      end loop;
      update public.dataset_video_policies set is_active=%s where id=(p->>'id')::uuid;
    end;"""
    policy_insert = """insert into public.dataset_video_policies
      (id,version,min_duration_ms,max_duration_ms,min_short_side_px,max_long_side_px,max_size_bytes,
       allowed_mime_types,created_by,approved_at,is_active)
      select (p->>'id')::uuid,p->>'version',(p->>'min_duration_ms')::int,(p->>'max_duration_ms')::int,
       (p->>'min_short_side_px')::int,(p->>'max_long_side_px')::int,(p->>'max_size_bytes')::bigint,
       array(select jsonb_array_elements_text(p->'allowed_mime_types')),(p->>'created_by')::uuid,now(),false
      on conflict (id) do nothing;"""
    label_insert = """insert into public.dataset_labels(id,code,display_name,description,created_by,is_active)
      values((item->>'id')::uuid,item->>'code',item->>'display_name',item->>'description',
       (item->>'created_by')::uuid,false) on conflict (id) do nothing;"""
    body = body % (literal(payload), policy_insert if active else "", label_insert if active else "",
                   "true" if active else "false", "true" if active else "false")
    tag = "$dataset_pilot$"
    while tag in body:
        tag = tag[:-1] + "_x$"
    return "begin;\ndo " + tag + "\n" + body + "\n" + tag + ";\ncommit;"


def atomic_write(path, content):
    require(not path.is_symlink(), "symlink_write_rejected")
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix=".dataset-pilot-", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


@contextmanager
def operation_lock(path):
    import fcntl
    path.parent.mkdir(parents=True, exist_ok=True)
    require(not path.is_symlink(), "lock_symlink_rejected")
    fd = os.open(path, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, "w") as stream:
        try:
            fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise PilotError("pilot_operation_already_running") from None
        yield


def media_tools():
    return {name: shutil.which(os.environ.get("DATASET_" + name.upper(), name))
            for name in ("ffmpeg", "ffprobe", "prlimit")}


def require_media_tools():
    tools = media_tools()
    require(os.name == "posix" and all(tools.values()), "local_media_tools_required_before_activation")
    for name in ("ffmpeg", "ffprobe"):
        result = subprocess.run([tools[name], "-version"], stdout=subprocess.DEVNULL,
                                stderr=subprocess.DEVNULL, timeout=5)
        require(result.returncode == 0, "local_media_tool_not_executable")


def change(stack, data, actor, approval, active, env_path=ENV, receipt_root=None):
    authorize(data, approval, actor)
    if active:
        require_media_tools()
    require(not env_path.is_symlink(), "environment_symlink_rejected")
    state = snapshot(stack, data, actor)
    desired = specs(data, actor)
    check_snapshot(state, desired)
    path = (receipt_root or REPO / "supabase/.temp/dataset-pilot") / (digest(data) + ".json")
    with operation_lock(path.with_suffix(".lock")):
        text = env_path.read_text(encoding="utf-8")
        current = consent_lines(text)
        require(not path.is_symlink(), "receipt_symlink_rejected")
        if path.exists():
            receipt = json.loads(path.read_text())
            require(receipt["manifest_sha256"] == digest(data) and receipt["created_by"] == str(UUID(actor)),
                    "receipt_owner_or_version_changed")
        else:
            require(active, "activation_receipt_required_to_deactivate")
            require(not any(parse_env(text).get(key, "") for key in MANAGED), "existing_consent_preserved")
            receipt = {"manifest_sha256": digest(data), "created_by": str(UUID(actor)), "before": current,
                       "policy_id": desired["policy"]["id"], "label_ids": [r["id"] for r in desired["labels"]]}
        target = desired_lines(data) if active else receipt["before"]
        require(current in (receipt["before"], desired_lines(data)), "manual_consent_changes_preserved")
        receipt["phase"] = "activation_prepared" if active else "deactivation_prepared"
        atomic_write(path, json.dumps(receipt, ensure_ascii=False, indent=2) + "\n")
        # If the database commit outcome is uncertain, do not compensate blindly.
        # The durable prepared receipt and immutable IDs allow a safe same-plan retry.
        stack.sql(mutation_sql(desired, active))
        receipt["phase"] = "database_committed"
        atomic_write(path, json.dumps(receipt, ensure_ascii=False, indent=2) + "\n")
        latest = env_path.read_text(encoding="utf-8")
        require(consent_lines(latest) == current, "environment_changed_retry_without_overwriting")
        atomic_write(env_path, patch_consent(latest, target))
        receipt["phase"] = "active" if active else "inactive"
        receipt["completed_at"] = datetime.now(timezone.utc).isoformat()
        atomic_write(path, json.dumps(receipt, ensure_ascii=False, indent=2) + "\n")
    return {"phase": receipt["phase"], "policy_id": desired["policy"]["id"], "manifest_sha256": digest(data),
            "restart_frontend_required": True, "data_or_objects_deleted": False}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["plan", "apply", "deactivate"], nargs="?", default="plan")
    parser.add_argument("--offline", action="store_true", help="Plan from local files only; never connects")
    parser.add_argument("--actor", help="Existing local admin profile UUID; no account/role/grant is created")
    parser.add_argument("--approve", help="Exact manifest SHA-256, only after user approval")
    args = parser.parse_args(argv)
    data = load_manifest()
    if args.action != "plan":
        authorize(data, args.approve, args.actor, args.offline)  # Gate before ANY connection or receipt write.
    result = {"action": args.action, "approval_sha256": digest(data), "proposal": data,
              "seed_executed": False, "media_tools": media_tools()}
    if not args.offline:
        stack = connect()
        result["local_state"] = snapshot(stack, data, args.actor)
        if args.action != "plan":
            result["result"] = change(stack, data, args.actor, args.approve, args.action == "apply")
            result["seed_executed"] = True
            require(stack.fingerprint() == stack.before_fingerprint, "security_definition_changed")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        # Never echo environment values, credentials, HTTP bodies, or subprocess stderr.
        print(json.dumps({"pilot_error": str(error) if isinstance(error, PilotError) else type(error).__name__,
                          "message": "Pilot operation stopped. No secrets logged; inspect plan and retry the same approved version."}))
        raise SystemExit(1) from None
