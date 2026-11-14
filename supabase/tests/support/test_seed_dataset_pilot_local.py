"""Pure safety tests for the pilot plan. Never connects to PostgreSQL or runs DML."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
from uuid import uuid4
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import pytest

ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location("pilot_seed", ROOT / "supabase/scripts/seed_dataset_pilot_local.py")
pilot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pilot)
ACTOR = "cb64db86-42aa-42a0-bcb8-9c7f632970ce"


@pytest.fixture
def draft(tmp_path, monkeypatch):
    # The operator's academic DOCX is intentionally untracked. Exercise the real
    # source/hash/XML validation with a synthetic document in the test directory.
    data = json.loads(pilot.MANIFEST.read_text())
    inventory = [label["display_name"] for label in data["labels"]]
    inventory += [f"Synthetic label {index}" for index in range(40 - len(inventory))]
    ns = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    document = ET.Element(ns + "document")
    paragraph = ET.SubElement(ET.SubElement(document, ns + "body"), ns + "p")
    ET.SubElement(ET.SubElement(paragraph, ns + "r"), ns + "t").text = (
        data["source"]["anchor"] + " " + ", ".join(inventory) + ". Penamaan fixture."
    )
    source = tmp_path / "synthetic-proposal.docx"
    with ZipFile(source, "w") as archive:
        archive.writestr("word/document.xml", ET.tostring(document))
    data["source"].update(path=source.name, sha256=hashlib.sha256(source.read_bytes()).hexdigest())
    manifest = tmp_path / "pilot.json"
    manifest.write_text(json.dumps(data))
    load = pilot.load_manifest
    monkeypatch.setattr(pilot, "load_manifest", lambda path=manifest, root=tmp_path: load(path, root))
    return pilot.load_manifest()


def state(desired):
    return {"active_policies": [], "policies": [], "labels": [],
            "actor_is_local_admin": True, "columns": [], "pilot_contributions": 0}


def changed_manifest(tmp_path, draft, mutate):
    value = copy.deepcopy(draft)
    mutate(value)
    path = tmp_path / "proposal.json"
    path.write_text(json.dumps(value))
    return path


def test_selected_labels_are_validated_against_synthetic_proposal(draft):
    assert [row["display_name"] for row in draft["labels"]] == ["Halo", "Apa Kabar", "Terima Kasih", "Saya", "Makan"]


def test_policy_matches_actual_backend_contract(draft):
    import sys
    sys.path.insert(0, str(ROOT / "apps/backend"))
    from app.schemas.dataset import VideoPolicy, ContributionInput
    policy = {**draft["policy"], "id": str(uuid4())}
    assert VideoPolicy.model_validate(policy).max_size_bytes == 16777216
    assert (policy["min_duration_ms"], policy["max_duration_ms"]) == (3000, 7000)
    metadata = ContributionInput(proposed_label_id=uuid4(), consent=True, consent_version=draft["consent"]["version"])
    assert metadata.recognition_event_id is None
    assert metadata.consent_version == "dev-local-consent-draft-v1"


@pytest.mark.parametrize("mutate", [
    lambda value: value.update(local_only=False),
    lambda value: value["policy"].update(min_duration_ms=0),
    lambda value: value["policy"].update(min_duration_ms=1000),
    lambda value: value["policy"].update(max_duration_ms=10000),
    lambda value: value["policy"].update(max_duration_ms=1),
    lambda value: value["policy"].update(max_size_bytes=True),
    lambda value: value["policy"].update(allowed_mime_types=["text/plain"]),
    lambda value: value["policy"].update(fps=30),
    lambda value: value["labels"][0].update(display_name="Invented label"),
    lambda value: value["source"].update(sha256="0" * 64),
    lambda value: value["consent"].update(version="final-research-consent"),
])
def test_invalid_or_unapproved_source_cannot_be_used(tmp_path, draft, mutate):
    with pytest.raises(pilot.PilotError):
        pilot.load_manifest(changed_manifest(tmp_path, draft, mutate))


def test_approval_and_actor_are_required_before_any_write(draft):
    for approval, actor, offline in [(None, ACTOR, False), ("bad", ACTOR, False),
                                     (pilot.digest(draft), None, False),
                                     (pilot.digest(draft), ACTOR, True)]:
        with pytest.raises(pilot.PilotError):
            pilot.authorize(draft, approval, actor, offline)
    pilot.authorize(draft, pilot.digest(draft), ACTOR)


def test_changing_the_public_proposal_invalidates_approval(draft):
    changed = copy.deepcopy(draft)
    changed["policy"]["max_size_bytes"] += 1
    with pytest.raises(pilot.PilotError):
        pilot.authorize(changed, pilot.digest(draft), ACTOR)


def test_ids_are_stable_and_policy_snapshots_are_versioned(draft):
    first = pilot.specs(draft, ACTOR)
    assert first == pilot.specs(draft, ACTOR)
    newer = copy.deepcopy(draft)
    newer["policy"]["version"] = "dev-local-pilot-v2"
    second = pilot.specs(newer, ACTOR)
    assert first["policy"]["id"] != second["policy"]["id"]
    assert first["labels"] == second["labels"]


@pytest.mark.parametrize("conflict", ["other_active", "code_collision", "changed_values", "not_admin"])
def test_existing_state_is_preserved(draft, conflict):
    expected = pilot.specs(draft, ACTOR)
    live = state(expected)
    if conflict == "other_active":
        live["active_policies"] = [{"id": str(uuid4())}]
    if conflict == "code_collision":
        live["labels"] = [{**expected["labels"][0], "id": str(uuid4())}]
    if conflict == "changed_values":
        live["policies"] = [{**expected["policy"], "max_size_bytes": 1}]
    if conflict == "not_admin":
        live["actor_is_local_admin"] = False
    with pytest.raises(pilot.PilotError):
        pilot.check_snapshot(live, expected)


def test_known_snapshot_is_idempotent(draft):
    expected = pilot.specs(draft, ACTOR)
    live = state(expected)
    live["policies"] = [{**expected["policy"], "is_active": True, "approved_at": "synthetic", "created_at": "synthetic"}]
    live["labels"] = [{**label, "is_active": True, "created_at": "synthetic"} for label in expected["labels"]]
    pilot.check_snapshot(live, expected)


def test_sql_changes_configuration_only_and_keeps_concurrency_guards(draft):
    desired = pilot.specs(draft, ACTOR)
    sql = pilot.mutation_sql(desired, True)
    assert "pg_advisory_xact_lock" in sql and "share row exclusive mode" in sql
    assert "on conflict (id) do nothing" in sql and "Other active policy preserved" in sql
    for prohibited in ["delete from", "truncate", "drop table", "alter table", "disable trigger",
                       "dataset_contributions", "storage.objects", "dataset_curator_grants"]:
        assert prohibited not in sql.lower()
    rollback = pilot.mutation_sql(desired, False)
    assert "insert into" not in rollback and "delete from" not in rollback
    assert "set is_active=false" in rollback


def test_environment_patch_preserves_unrelated_values_and_has_no_global_secret_backup(draft):
    original = "NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55431\nUNRELATED=leave-me\n" + pilot.MANAGED[0] + "=\n" + pilot.MANAGED[1] + "=\n"
    before = pilot.consent_lines(original)
    updated = pilot.patch_consent(original, pilot.desired_lines(draft))
    assert "UNRELATED=leave-me" in updated
    assert pilot.parse_env(updated)[pilot.MANAGED[1]] == draft["consent"]["text"]
    assert pilot.patch_consent(updated, before) == original


def test_duplicate_environment_keys_fail_closed():
    with pytest.raises(pilot.PilotError):
        pilot.parse_env("KEY=first\nKEY=second\n")


class FakeStack:
    def __init__(self):
        self.writes = []
        self.desired = None
    def sql_json(self, _query):
        return state(self.desired)
    def sql(self, sql):
        self.writes.append(sql)


def test_repeated_activation_and_deactivation_preserve_the_initial_environment(tmp_path, draft, monkeypatch):
    # Database transport is a pure fake; all files are under pytest's temp dir.
    monkeypatch.setattr(pilot, "require_media_tools", lambda: None)
    fake = FakeStack()
    fake.desired = pilot.specs(draft, ACTOR)
    env = tmp_path / ".env.local"
    original = "UNRELATED=untouched\n" + pilot.MANAGED[0] + "=\n" + pilot.MANAGED[1] + "=\n"
    env.write_text(original)
    receipts = tmp_path / "receipts"
    for _ in range(2):
        result = pilot.change(fake, draft, ACTOR, pilot.digest(draft), True, env, receipts)
        assert result["phase"] == "active"
    receipt = json.loads(next(receipts.glob("*.json")).read_text())
    assert receipt["before"] == pilot.consent_lines(original)
    result = pilot.change(fake, draft, ACTOR, pilot.digest(draft), False, env, receipts)
    assert result["phase"] == "inactive" and env.read_text() == original
    assert all("delete from" not in sql.lower() for sql in fake.writes)


def test_manual_consent_edits_are_never_overwritten(tmp_path, draft, monkeypatch):
    monkeypatch.setattr(pilot, "require_media_tools", lambda: None)
    fake = FakeStack()
    fake.desired = pilot.specs(draft, ACTOR)
    env = tmp_path / ".env.local"
    env.write_text(pilot.MANAGED[0] + "=existing-approved-version\n")
    with pytest.raises(pilot.PilotError, match="existing_consent_preserved"):
        pilot.change(fake, draft, ACTOR, pilot.digest(draft), True, env, tmp_path / "receipts")
    assert not fake.writes
    assert "existing-approved-version" in env.read_text()


def test_offline_plan_never_connects_or_seeds(draft, monkeypatch, capsys):
    monkeypatch.setattr(pilot, "connect", lambda: pytest.fail("offline plan tried connecting"))
    assert pilot.main(["plan", "--offline"]) == 0
    output = json.loads(capsys.readouterr().out)
    assert output["seed_executed"] is False
    assert output["approval_sha256"] == pilot.digest(draft)

def test_live_snapshot_uses_a_read_only_transaction(draft):
    class ReadOnly:
        def sql_json(self, query):
            assert query.startswith("begin transaction read only;")
            assert query.endswith("rollback;")
            assert "insert into" not in query.lower()
            return {"read_only": True}
    assert pilot.snapshot(ReadOnly(), draft)["read_only"] is True


def test_missing_approval_cannot_reach_connection(draft, monkeypatch):
    monkeypatch.setattr(pilot, "connect", lambda: pytest.fail("unapproved operation connected"))
    with pytest.raises(pilot.PilotError, match="explicit_matching_approval"):
        pilot.main(["apply", "--actor", ACTOR])


def test_missing_media_tools_stop_activation_before_receipt_or_database(tmp_path, draft, monkeypatch):
    monkeypatch.setattr(pilot, "media_tools", lambda: {"ffmpeg": None, "ffprobe": None, "prlimit": "/usr/bin/prlimit"})
    fake = FakeStack()
    env = tmp_path / ".env.local"
    env.write_text("UNRELATED=preserved")
    receipts = tmp_path / "receipts"
    with pytest.raises(pilot.PilotError, match="local_media_tools_required"):
        pilot.change(fake, draft, ACTOR, pilot.digest(draft), True, env, receipts)
    assert not fake.writes and not receipts.exists()
    assert env.read_text() == "UNRELATED=preserved"
