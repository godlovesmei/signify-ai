"""Fail CI when backend line or branch coverage is below the agreed gate."""

import json
import sys
from pathlib import Path


def percentage(covered: int, total: int) -> float:
    return 100.0 if total == 0 else covered / total * 100


report_path = Path(sys.argv[1] if len(sys.argv) > 1 else "coverage.json")
totals = json.loads(report_path.read_text(encoding="utf-8"))["totals"]
line_rate = percentage(totals["covered_lines"], totals["num_statements"])
branch_rate = percentage(totals["covered_branches"], totals["num_branches"])

print(f"Backend line coverage: {line_rate:.2f}% (target >= 70%)")
print(f"Backend branch coverage: {branch_rate:.2f}% (target >= 60%)")

if line_rate < 70 or branch_rate < 60:
    raise SystemExit(1)
