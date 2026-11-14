#!/usr/bin/env python3
"""Start one production dataset process; no local-Supabase discovery."""
import os
from pathlib import Path
import shutil
import sys

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))


def main():
    os.environ.setdefault("DATASET_ENVIRONMENT", "production")
    from app.config.dataset_settings import DatasetSettings
    settings = DatasetSettings()
    if settings.environment != "production":
        raise RuntimeError("Use run_dataset_local.py for local development.")
    if os.name != "posix" or any(not shutil.which(tool) for tool in (settings.ffmpeg, settings.ffprobe, "prlimit")):
        raise RuntimeError("The backend requires Linux, FFmpeg, FFprobe and prlimit.")
    settings.work_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    import tempfile
    with tempfile.TemporaryFile(dir=settings.work_dir):
        pass
    port = int(os.environ.get("PORT", "8001"))
    if not 1 <= port <= 65535:
        raise RuntimeError("PORT must be between 1 and 65535.")
    if "--check" in sys.argv:
        print("Production settings and runtime dependencies are valid; no remote connection made.")
        return
    import uvicorn
    from dataset_main import app
    # One process/instance preserves filesystem locks and resource budgets.
    uvicorn.run(app, host="0.0.0.0", port=port, workers=1, access_log=False)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, RuntimeError, OSError):
        print("Dataset startup failed: check production environment, media tools, and persistent storage. Secret values are suppressed.", file=sys.stderr)
        sys.exit(1)
