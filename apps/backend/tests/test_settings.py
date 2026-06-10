"""Reliability checks for backend environment parsing."""

from pathlib import Path

from app.config.settings import DEFAULT_ENV_FILES, Settings


def test_tc_023_unrelated_debug_environment_value_does_not_break_startup(
    monkeypatch,
):
    monkeypatch.setenv("DEBUG", "release")
    settings = Settings(_env_file=None)

    assert settings.APP_DEBUG is False


def test_tc_023_backend_security_defaults_are_fail_safe():
    settings = Settings(_env_file=None)

    assert settings.APP_DEBUG is False
    assert settings.REQUIRE_AUTH is False
    assert settings.INFERENCE_TIMEOUT_SECONDS > 0


def test_tc_023_backend_env_file_path_is_independent_of_launch_directory():
    backend_env = Path(__file__).resolve().parents[1] / ".env"

    assert backend_env in DEFAULT_ENV_FILES
    assert all(path.is_absolute() for path in DEFAULT_ENV_FILES)
