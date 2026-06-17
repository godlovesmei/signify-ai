"""Signify AI staging load profiles with production-readiness thresholds."""

import os
from pathlib import Path

from locust import HttpUser, between, events, task

PROFILE = os.getenv("LOCUST_PROFILE", "mixed")
MIN_RPS = 5.0 if PROFILE == "inference" else 50.0
IMAGE = (
    Path(__file__).resolve().parents[2]
    / "apps"
    / "frontend"
    / "public"
    / "alfabet"
    / "A.jpg"
).read_bytes()


class MixedReadUser(HttpUser):
    """Frontend/public read profile. Run with the staging frontend as --host."""

    wait_time = between(0.2, 0.8)
    weight = 4

    @task(5)
    def landing_page(self):
        self.client.get("/", name="GET /")

    @task(2)
    def protected_dashboard_redirect(self):
        self.client.get("/history", name="GET /history", allow_redirects=False)

    @task(2)
    def public_documentation(self):
        self.client.get("/how-it-works", name="GET /how-it-works")

    @task
    def manifest(self):
        self.client.get("/manifest.webmanifest", name="GET /manifest.webmanifest")


class InferenceUser(HttpUser):
    """Legacy backend inference profile. Run with the optional backend as --host."""

    wait_time = between(0.5, 1.5)
    weight = 1

    @task(5)
    def predict(self):
        headers = {}
        token = os.getenv("PERF_BEARER_TOKEN")
        if token:
            headers["Authorization"] = f"Bearer {token}"
        self.client.post(
            "/api/v1/translate/predict",
            files={"file": ("A.jpg", IMAGE, "image/jpeg")},
            headers=headers,
            name="POST /api/v1/translate/predict",
        )

    @task
    def health_and_classes(self):
        self.client.get("/health", name="GET /health")
        self.client.get("/api/v1/translate/classes", name="GET /api/v1/translate/classes")


class OptionalAuthUser(HttpUser):
    """Optional test-project-only Supabase password auth profile."""

    wait_time = between(1, 3)
    weight = 1

    @task
    def login(self):
        email = os.getenv("PERF_AUTH_EMAIL")
        password = os.getenv("PERF_AUTH_PASSWORD")
        if not email or not password:
            self.environment.runner.quit()
            return
        self.client.post(
            "/auth/v1/token?grant_type=password",
            json={"email": email, "password": password},
            name="POST /auth/v1/token",
        )


@events.quitting.add_listener
def enforce_targets(environment, **_kwargs):
    total = environment.stats.total
    checks = {
        "average response time <= 2800 ms": total.avg_response_time <= 2800,
        "P50 <= 2000 ms": total.get_current_response_time_percentile(0.50) <= 2000,
        "P95 <= 4500 ms": total.get_current_response_time_percentile(0.95) <= 4500,
        "P99 <= 6000 ms": total.get_current_response_time_percentile(0.99) <= 6000,
        "failure rate <= 1%": total.fail_ratio <= 0.01,
        f"average RPS >= {MIN_RPS:g}": total.total_rps >= MIN_RPS,
    }
    failed = [name for name, passed in checks.items() if not passed]
    if failed:
        print("Performance gate failed: " + "; ".join(failed))
        environment.process_exit_code = 1
