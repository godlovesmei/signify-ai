"""Ensure the fixture allowlist cannot mask changed or verified credentials."""

from contextlib import redirect_stderr, redirect_stdout
import io
import json
import unittest

from check_secret_scan import SYNTHETIC_URIS, check_scan


class SecretScanTests(unittest.TestCase):
    def result(self, finding=None, exit_code=183, raw_output=None):
        output = raw_output if raw_output is not None else json.dumps(finding)
        with redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            return check_scan(output, exit_code)

    def fixture(self):
        path, uri = sorted(SYNTHETIC_URIS)[0]
        return {"SourceMetadata": {"Data": {"Git": {"file": path, "line": 1}}},
                "DetectorName": "URI", "Verified": False, "Raw": uri}

    def test_clean_scan(self):
        self.assertEqual(self.result(exit_code=0, raw_output=""), 0)

    def test_exact_synthetic_uris(self):
        for path, uri in SYNTHETIC_URIS:
            finding = self.fixture()
            finding["SourceMetadata"]["Data"]["Git"]["file"] = path
            finding["Raw"] = uri
            self.assertEqual(self.result(finding), 0)

    def test_verified_fixture_is_blocked(self):
        finding = self.fixture()
        finding["Verified"] = True
        self.assertEqual(self.result(finding), 1)

    def test_changed_path_is_blocked(self):
        finding = self.fixture()
        finding["SourceMetadata"]["Data"]["Git"]["file"] = "production.py"
        self.assertEqual(self.result(finding), 1)

    def test_changed_value_is_blocked(self):
        finding = self.fixture()
        finding["Raw"] += "changed"
        self.assertEqual(self.result(finding), 1)

    def test_other_detector_is_blocked(self):
        finding = self.fixture()
        finding["DetectorName"] = "AWS"
        self.assertEqual(self.result(finding), 1)

    def test_missing_verification_is_blocked(self):
        finding = self.fixture()
        del finding["Verified"]
        self.assertEqual(self.result(finding), 1)

    def test_malformed_output_is_blocked(self):
        for output in ("not json", "{}", "null", "[]"):
            self.assertEqual(self.result(raw_output=output), 1)

    def test_scanner_errors_are_blocked(self):
        self.assertEqual(self.result(exit_code=1, raw_output=""), 1)

    def test_missing_evidence_is_blocked(self):
        self.assertEqual(self.result(raw_output=""), 1)


if __name__ == "__main__":
    unittest.main()
