"""Reject scanner errors and findings except three exact, invalid test URLs."""

import json
from pathlib import Path
import sys

# These URLs test rejection of credentials in origins. Match both the file and
# complete value; other findings in these files must still fail the scan.
SYNTHETIC_URIS = {
    ("apps/frontend/lib/dataset/config.test.ts", "http://127.0.0.1:8001@remote.invalid"),  # trufflehog:ignore -- invalid test origin
    ("apps/frontend/lib/dataset/config.production.test.ts", "https://user:secret@dataset.example.com"),  # trufflehog:ignore -- reserved example domain
    ("apps/backend/tests/dataset/test_dataset_api.py", "http://127.0.0.1:55431@untrusted.example"),  # trufflehog:ignore -- invalid test origin
}


def check_scan(source: str, scanner_exit: int) -> int:
    if scanner_exit not in (0, 183):
        print(f"Secret scanner failed with exit code {scanner_exit}.", file=sys.stderr)
        return 1
    accepted = findings = blocked = 0
    try:
        for line in source.splitlines():
            if not line.strip():
                continue
            finding = json.loads(line)
            metadata = finding["SourceMetadata"]["Data"]["Git"]
            findings += 1
            if (finding.get("DetectorName") == "URI" and finding.get("Verified") is False
                    and (metadata["file"], finding.get("Raw")) in SYNTHETIC_URIS):
                accepted += 1
                continue
            blocked += 1
            # Never echo detected credential values into CI logs.
            print("Blocked secret finding: " + json.dumps({
                "detector": finding.get("DetectorName"), "file": metadata["file"],
                "line": metadata.get("line"),
            }))
    except (ValueError, KeyError, TypeError):
        print("Invalid secret scanner JSON output.", file=sys.stderr)
        return 1
    if scanner_exit == 183 and not findings:
        print("Scanner reported findings without JSON evidence.", file=sys.stderr)
        return 1
    print(f"Secret scan: {blocked} blocked findings; {accepted} exact synthetic URL fixtures.")
    return int(blocked > 0)


if __name__ == "__main__":
    raise SystemExit(check_scan(Path(sys.argv[1]).read_text(), int(sys.argv[2])))
