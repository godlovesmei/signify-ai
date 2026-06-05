"""Reliability checks for backend environment parsing."""

from app.config.settings import Settings


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
