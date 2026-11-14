#!/usr/bin/env python3
"""Run the dataset API against the verified local Docker stack, without printing keys."""
import argparse
import os
from pathlib import Path
import secrets
import subprocess
import json
import sys

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--ffmpeg", default="ffmpeg")
    parser.add_argument("--ffprobe", default="ffprobe")
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535 or args.port in (5432, 55431, 55432, 54323):
        parser.error("Choose a separate unprivileged backend port.")
    if os.name != "posix":
        parser.error("Run this local development launcher inside Ubuntu WSL.")
    docker = ["docker", "--host", "unix:///var/run/docker.sock"]
    project = "signify-supabase-local"

    def inspect(service):
        result = subprocess.run(docker + ["inspect", "supabase_" + service + "_" + project],
                                capture_output=True, text=True, timeout=10)
        if result.returncode:
            raise RuntimeError("Local Supabase container is not available.")
        data = json.loads(result.stdout)[0]
        if (data["Config"].get("Labels", {}).get("com.supabase.cli.project") != project
                or list(data["NetworkSettings"]["Networks"]) != ["signify-local-only"]):
            raise RuntimeError("Local container identity mismatch.")
        for rows in (data["NetworkSettings"].get("Ports") or {}).values():
            if any(row["HostIp"] not in ("127.0.0.1", "::1") for row in rows or []):
                raise RuntimeError("Container is not bound exclusively to loopback.")
        return data

    studio, auth, gateway = inspect("studio"), inspect("auth"), inspect("kong")
    if not any(row["HostPort"] == "55431" for rows in gateway["NetworkSettings"]["Ports"].values() for row in rows or []):
        raise RuntimeError("Expected local API port was not found.")
    env = dict(value.split("=", 1) for value in studio["Config"]["Env"] if "=" in value)
    auth_env = dict(value.split("=", 1) for value in auth["Config"]["Env"] if "=" in value)
    if auth_env.get("API_EXTERNAL_URL") != "http://127.0.0.1:55431/auth/v1":
        raise RuntimeError("Local Auth issuer mismatch.")
    private = BACKEND / ".dataset-runtime"
    private.mkdir(mode=0o700, exist_ok=True)
    key_path = private / "idempotency.key"
    try:
        fd = os.open(key_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    except FileExistsError:
        if key_path.is_symlink() or key_path.stat().st_mode & 0o077:
            raise RuntimeError("Private idempotency key permissions are unsafe.")
    else:
        with os.fdopen(fd, "w") as handle:
            handle.write(secrets.token_hex(32))
    persistent_key = key_path.read_text()
    if len(persistent_key) < 32:
        raise RuntimeError("Private idempotency key is incomplete.")
    from app.config.dataset_settings import DatasetSettings
    from dataset_main import create_app
    import uvicorn
    settings = DatasetSettings(_env_file=None, supabase_url="http://127.0.0.1:55431",
                               anon_key=env["SUPABASE_ANON_KEY"], service_role_key=env["SUPABASE_SERVICE_KEY"],
                               jwt_hs256_secret=auth_env["GOTRUE_JWT_SECRET"],
                               idempotency_secret=persistent_key, ffmpeg=args.ffmpeg, ffprobe=args.ffprobe)
    print("Starting local dataset API on 127.0.0.1:" + str(args.port) + "; credentials remain in memory.")
    uvicorn.run(create_app(settings), host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, KeyError, ValueError, subprocess.SubprocessError):
        # Never echo container output, secrets, or settings values.
        print("Local dataset setup is unavailable; verify the isolated Docker stack and private configuration.", file=sys.stderr)
        sys.exit(1)
