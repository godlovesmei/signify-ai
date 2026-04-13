#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE="${1:-all}"
TARGET_ENV="${2:-staging}"

log() {
	printf '[deploy] %s\n' "$*"
}

fail() {
	printf '[deploy] ERROR: %s\n' "$*" >&2
	exit 1
}

require_cmd() {
	if ! command -v "$1" >/dev/null 2>&1; then
		fail "Missing required command: $1"
	fi
}

select_compose_file() {
	case "$TARGET_ENV" in
		staging|dev)
			printf '%s\n' "$ROOT_DIR/infrastructure/docker-compose.yml"
			;;
		production|prod)
			printf '%s\n' "$ROOT_DIR/infrastructure/docker-compose.prod.yml"
			;;
		*)
			fail "Unsupported environment '$TARGET_ENV'. Use staging|dev|production|prod."
			;;
	esac
}

service_args() {
	case "$SERVICE" in
		all)
			printf '%s\n' ""
			;;
		backend|frontend|ml)
			printf '%s\n' "$SERVICE"
			;;
		*)
			fail "Unsupported service '$SERVICE'. Use all|backend|frontend|ml."
			;;
	esac
}

wait_backend_health() {
	local attempts=20
	local url="${BACKEND_HEALTH_URL:-http://localhost:8000/health}"

	for i in $(seq 1 "$attempts"); do
		if curl -fsS "$url" >/dev/null 2>&1; then
			log "Backend health check passed: $url"
			return 0
		fi
		sleep 2
	done

	fail "Backend health check failed after $attempts attempts: $url"
}

main() {
	require_cmd docker
	require_cmd curl

	local compose_file
	compose_file="$(select_compose_file)"

	if [[ ! -s "$compose_file" ]]; then
		fail "Compose file missing or empty: $compose_file"
	fi

	local svc
	svc="$(service_args)"

	log "Deploy target env: $TARGET_ENV"
	log "Deploy service: $SERVICE"
	log "Compose file: $compose_file"

	if [[ -n "$svc" ]]; then
		docker compose -f "$compose_file" up -d --build "$svc"
	else
		docker compose -f "$compose_file" up -d --build
	fi

	if [[ "$SERVICE" == "backend" || "$SERVICE" == "all" ]]; then
		wait_backend_health
	fi

	log "Deployment finished successfully"
}

main "$@"
