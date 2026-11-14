#!/usr/bin/env python3
"""Approved local pilot E2E: generated color patterns only; no humans, curation or exports."""
import importlib.util
import json
import os
from pathlib import Path
import secrets
import subprocess
import uuid
import httpx

REPO = Path(__file__).resolve().parents[3]
ACTOR = "9a13248c-6213-42aa-82a7-1b92fe9ca875"
APPROVAL = "2300a3089c3b8b8b90897b1bd7ec681f40a6bc5ec2a2902d4a5634dda0d2a961"
MEDIA = REPO / "apps/backend/.dataset-runtime/media-v1/bin"
NODE = Path("/home/bunga/.nvm/versions/node/v24.14.0/bin/node")


def main():
    spec = importlib.util.spec_from_file_location("approved_pilot", REPO / "supabase/scripts/seed_dataset_pilot_local.py")
    pilot = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(pilot)
    data = pilot.load_manifest()
    assert pilot.digest(data) == APPROVAL
    stack = pilot.connect()
    state = pilot.snapshot(stack, data, ACTOR)
    pilot.check_snapshot(state, pilot.specs(data, ACTOR))
    assert len(state["active_policies"]) == 1 and len(state["labels"]) == 5
    assert all(row["is_active"] for row in state["labels"])
    assert state["policies"][0]["is_active"]
    env = pilot.parse_env(pilot.ENV.read_text())
    assert env[pilot.MANAGED[0]] == data["consent"]["version"] and env[pilot.MANAGED[1]] == data["consent"]["text"]
    # Fail before generating fixtures or accounts if a development server is unavailable.
    with httpx.Client(trust_env=False, follow_redirects=False, timeout=60) as client:
        assert client.get("http://127.0.0.1:8001/health").status_code == 200
        assert client.get("http://127.0.0.1:3000/en?login=1").status_code == 200
    run_id = uuid.uuid4().hex
    directory = REPO / "apps/frontend/test-results/dataset-pilot" / run_id
    directory.mkdir(parents=True, mode=0o700)
    fixtures = directory / "fixtures"
    fixtures.mkdir(mode=0o700)

    def ffmpeg(name, args):
        output = fixtures / name
        assert not output.exists()
        command = ["/usr/bin/prlimit", "--as=1073741824", "--cpu=25", "--fsize=104857600", "--nofile=64", "--",
                   str(MEDIA / "ffmpeg"), "-v", "error", "-nostdin", "-cpucount", "1",
                   "-filter_threads", "1", "-threads", "1", *args, str(output)]
        subprocess.run(command, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                       stderr=subprocess.DEVNULL, timeout=30, check=True)
        return str(output)

    # Entirely algorithmic pixels/audio; no user media or external input files.
    camera = ffmpeg("color-pattern.y4m", ["-f", "lavfi", "-i", "testsrc2=size=640x480:rate=15",
                                          "-t", "12", "-pix_fmt", "yuv420p", "-f", "yuv4mpegpipe"])
    def movie(name, size, seconds):
        return ffmpeg(name, ["-f", "lavfi", "-i", "color=c=navy:s=" + size + ":r=15",
                             "-t", str(seconds), "-c:v", "libx264", "-preset", "ultrafast",
                             "-threads", "1", "-pix_fmt", "yuv420p", "-movflags", "+faststart"])
    files = {"valid": movie("valid.mp4", "640x480", 2),
             "short": movie("short.mp4", "640x480", .4),
             "long": movie("long.mp4", "640x480", 11),
             "small": movie("small.mp4", "160x120", 2),
             "large": movie("large.mp4", "1440x810", 2),
             "audio": ffmpeg("audio-only.mp4", ["-f", "lavfi", "-i", "anullsrc=r=8000:cl=mono",
                                                 "-t", "2", "-c:a", "aac", "-threads", "1"])}
    actors = []
    for index in range(2):
        email = "pilot-synthetic-" + run_id + "-" + str(index) + "@example.test"
        password = secrets.token_urlsafe(32)
        response = stack.request("POST", "/auth/v1/admin/users", stack.service, {
            "email": email, "password": password, "email_confirm": True,
            "user_metadata": {"display_name": "Synthetic technical pilot - no human",
                              "dataset_pilot_run": run_id, "synthetic_only": True},
        })
        assert response["status"] in (200, 201)
        actors.append({"id": response["json"]["id"], "email": email, "password": password})
    actor_ids = ",".join(pilot.literal(row["id"]) for row in actors)
    assert stack.sql("select count(*) from public.profiles where user_id in (" + actor_ids + ") and role='user';") == "2"
    print("PILOT_E2E_SYNTHETIC_FIXTURES_READY", flush=True)
    result = subprocess.run([str(NODE), "tests/e2e/dataset-pilot.local.mjs"],
                            cwd=REPO / "apps/frontend", input=json.dumps({
                                "runId": run_id, "actors": actors, "publicKey": stack.anon,
                                "policy": {**data["policy"], "id": state["policies"][0]["id"]},
                                "labels": state["labels"], "consentVersion": data["consent"]["version"],
                                "camera": camera, "files": files, "directory": str(directory),
                            }), text=True, timeout=300)
    report_path = directory / "report.json"
    report = json.loads(report_path.read_text()) if report_path.exists() else {"results": []}
    rows = stack.sql_json("select coalesce(json_agg(c),'[]'::json) from (select id,user_id,status,revision,final_label_id,current_review_id,"
                          "video_policy_id,consent_version,size_bytes,duration_ms,width,height,fps,mime_type,codec,source_sha256,video_object_path "
                          "from public.dataset_contributions where user_id in (" + actor_ids + ")) c;")
    objects = stack.sql_json("select coalesce(json_agg(name),'[]'::json) from storage.objects where bucket_id='dataset-contribution-videos' "
                             "and split_part(name,'/',1) in (" + actor_ids + ");")
    if result.returncode == 0:
        assert len(rows) == 2 and set(row["id"] for row in rows) == set(report["created_ids"])
    assert all(row["status"] == "PENDING" and row["final_label_id"] is None and row["current_review_id"] is None
               and row["video_policy_id"] == state["policies"][0]["id"]
               and row["consent_version"] == data["consent"]["version"] for row in rows)
    assert sorted(objects) == sorted(row["video_object_path"] for row in rows)
    assert stack.fingerprint() == stack.before_fingerprint
    assert stack.sql("select count(*) from public.profiles where user_id in (" + actor_ids + ") and role='user';") == "2"
    assert stack.sql("select count(*) from private.dataset_curator_grants where user_id in (" + actor_ids + ");") == "0"
    after = pilot.snapshot(stack, data, ACTOR)
    pilot.check_snapshot(after, pilot.specs(data, ACTOR))
    assert len(after["active_policies"]) == 1 and all(row["is_active"] for row in after["labels"])
    report["database_verification"] = {"contributions": len(rows), "objects": len(objects),
        "all_pending": bool(rows), "source_objects_match_rows": True, "rls_definitions_unchanged": True,
        "test_accounts_ordinary_users": True, "curator_grants_created": 0, "curation_or_export_invoked": False}
    report["stored_contributions"] = [{key: value for key, value in row.items() if key != "video_object_path"} for row in rows]
    report["policy_id"] = state["policies"][0]["id"]
    report["manifest_sha256"] = APPROVAL
    report["postgres_version"] = stack.report["postgres_version"]
    report["media_versions"] = {name: subprocess.check_output([str(MEDIA / name), "-version"], text=True).splitlines()[0]
                                for name in ("ffmpeg", "ffprobe")}
    report_path.write_text(json.dumps(report, indent=2))
    print("PILOT_E2E_REPORT",str(report_path.relative_to(REPO)),flush=True)
    print("PILOT_DATABASE",json.dumps(report["database_verification"]),flush=True)
    raise SystemExit(result.returncode)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("PILOT_E2E_FAILED " + type(error).__name__, flush=True)
        raise SystemExit(1) from None
