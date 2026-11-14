#!/usr/bin/env python3
"""Real local browser smoke test. Never seeds labels, policies, contributions or curator grants."""
import importlib.util
import json
from pathlib import Path
import secrets
import subprocess
import time
import uuid
import jwt

REPO = Path(__file__).resolve().parents[3]
NODE = Path("/home/bunga/.nvm/versions/node/v24.14.0/bin/node")


def main():
    source = Path(__file__).with_name("test_auth_storage_local.py")
    spec = importlib.util.spec_from_file_location("dataset_local_preflight", source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    stack = module.LocalSuite(Path("/home/bunga/signify-supabase-local"))
    stack.preflight()  # Read-only checks before any account is created.
    counts = "select json_build_object('policies',(select count(*) from public.dataset_video_policies where is_active),'labels',(select count(*) from public.dataset_labels where is_active));"
    before = stack.sql_json(counts)
    if before != {"policies": 0, "labels": 0}:
        raise RuntimeError("This empty-state smoke requires inactive pilot configuration; existing configuration was preserved.")
    env = dict(line.split("=", 1) for line in (REPO / "apps/frontend/.env.local").read_text().splitlines()
               if "=" in line and not line.startswith("#"))
    assert env.get("NEXT_PUBLIC_SUPABASE_URL") == "http://127.0.0.1:55431"
    assert env.get("NEXT_PUBLIC_DATASET_API_URL") == "http://127.0.0.1:8001"
    assert env.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") == stack.anon
    assert not any("SERVICE" in key.upper() or "SECRET" in key.upper() for key in env)
    actors = []
    for index in range(2):
        email = "dataset-browser-" + uuid.uuid4().hex + "@example.test"
        password = secrets.token_urlsafe(32)
        response = stack.request("POST", "/auth/v1/admin/users", stack.service, {
            "email": email, "password": password, "email_confirm": True,
            "user_metadata": {"display_name": "Synthetic browser contributor", "dataset_browser_test": True},
        })
        assert response["status"] in (200, 201)
        uid = response["json"]["id"]
        actors.append({"id": uid, "email": email, "password": password})
    other = stack.sql_json("select coalesce((select to_json(id) from public.dataset_contributions where deleted_at is null limit 1),'null'::json);")
    expired = jwt.encode({"sub": actors[0]["id"], "role": "authenticated", "aud": "authenticated",
                          "iss": "http://127.0.0.1:55431/auth/v1", "exp": int(time.time()) - 60},
                         stack.jwt_secret, algorithm="HS256")
    # Passwords and the synthetic expired token pass through stdin only. The
    # service-role key and signing secret never leave this trusted Python process.
    result = subprocess.run([str(NODE), "tests/e2e/dataset-local.smoke.mjs"],
                            cwd=REPO / "apps/frontend", input=json.dumps({
                                "actors": actors, "expiredToken": expired, "otherContribution": other,
                            }), text=True, timeout=300)
    assert stack.sql_json(counts) == before, "Pilot configuration changed during smoke"
    assert stack.fingerprint() == stack.before_fingerprint, "Database security definitions changed"
    print("LOCAL_CONFIG_UNCHANGED policies=0 labels=0; two ordinary synthetic Auth accounts retained")
    raise SystemExit(result.returncode)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # No exception repr, input, subprocess command or credential values.
        print("LOCAL_BROWSER_SMOKE_FAILED " + type(error).__name__)
        raise SystemExit(1) from None
