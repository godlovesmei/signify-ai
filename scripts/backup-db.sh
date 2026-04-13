#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/db}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DB_NAME="${DB_NAME:-signify}"

log() {
	printf '[backup-db] %s\n' "$*"
}

fail() {
	printf '[backup-db] ERROR: %s\n' "$*" >&2
	exit 1
}

require_cmd() {
	if ! command -v "$1" >/dev/null 2>&1; then
		fail "Missing required command: $1"
	fi
}

main() {
	require_cmd pg_dump

	if [[ -z "${DATABASE_URL:-}" ]]; then
		fail "DATABASE_URL is required."
	fi

	mkdir -p "$BACKUP_DIR"

	local out_file="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"
	log "Creating backup: $out_file"

	pg_dump \
		--dbname="$DATABASE_URL" \
		--format=custom \
		--file="$out_file" \
		--no-owner \
		--no-privileges

	log "Backup completed successfully"
}

main "$@"
