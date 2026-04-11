#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
	printf '[migrate-db] %s\n' "$*"
}

fail() {
	printf '[migrate-db] ERROR: %s\n' "$*" >&2
	exit 1
}

main() {
	if [[ -z "${MIGRATION_CMD:-}" ]]; then
		cat <<'EOF' >&2
[migrate-db] ERROR: MIGRATION_CMD is required.

Examples:
	MIGRATION_CMD="supabase db push" bash scripts/migrate-db.sh
	MIGRATION_CMD="alembic upgrade head" bash scripts/migrate-db.sh
EOF
		exit 1
	fi

	log "Repository root: $ROOT_DIR"
	log "Running migration command: $MIGRATION_CMD"

	pushd "$ROOT_DIR" >/dev/null
	bash -lc "$MIGRATION_CMD"
	popd >/dev/null

	log "Migration command completed"
}

main "$@"
