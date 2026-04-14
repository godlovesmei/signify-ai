#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE="${1:-all}"
TARGET_ENV="${2:-staging}"

HEALTHCHECK_ATTEMPTS="${HEALTHCHECK_ATTEMPTS:-30}"
HEALTHCHECK_INTERVAL_SECONDS="${HEALTHCHECK_INTERVAL_SECONDS:-2}"

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

require_production_confirmation() {
	if [[ "$TARGET_ENV" != "production" && "$TARGET_ENV" != "prod" ]]; then
		return
	fi

	if [[ "${CONFIRM_PROD_DEPLOY:-0}" != "1" ]]; then
		fail "Production deploy requires CONFIRM_PROD_DEPLOY=1."
	fi
}

validate_compose_config() {
	local compose_file="$1"

	# Validates compose syntax and required environment variables.
	docker compose -f "$compose_file" config -q >/dev/null
}

validate_service_exists() {
	local compose_file="$1"
	local service="$2"

	if [[ "$service" == "all" ]]; then
		return
	fi

	if ! docker compose -f "$compose_file" config --services | grep -Fxq "$service"; then
		fail "Service '$service' does not exist in compose file: $compose_file"
	fi
}

wait_http_health() {
	local service_name="$1"
	local url="$2"
	local attempts="$HEALTHCHECK_ATTEMPTS"
	local interval="$HEALTHCHECK_INTERVAL_SECONDS"

	for i in $(seq 1 "$attempts"); do
		if curl -fsS "$url" >/dev/null 2>&1; then
			log "$service_name health check passed: $url"
			return 0
		fi
		sleep "$interval"
	done

	fail "$service_name health check failed after $attempts attempts: $url"
}

run_post_deploy_health_checks() {
	case "$SERVICE" in
		backend)
			wait_http_health "Backend" "${BACKEND_HEALTH_URL:-http://localhost:8000/health}"
			;;
		frontend)
			wait_http_health "Frontend" "${FRONTEND_HEALTH_URL:-http://localhost:3000/}"
			;;
		all)
			wait_http_health "Backend" "${BACKEND_HEALTH_URL:-http://localhost:8000/health}"
			wait_http_health "Frontend" "${FRONTEND_HEALTH_URL:-http://localhost:3000/}"
			;;
		ml)
			log "Skipping HTTP health check for service: ml"
			;;
		*)
			fail "Unsupported service '$SERVICE'. Use all|backend|frontend|ml."
			;;
	esac
}

main() {
	require_cmd docker
	require_cmd curl
	require_production_confirmation

	local compose_file
	compose_file="$(select_compose_file)"

	if [[ ! -s "$compose_file" ]]; then
		fail "Compose file missing or empty: $compose_file"
	fi
	validate_compose_config "$compose_file"

	local svc
	svc="$(service_args)"
	validate_service_exists "$compose_file" "$SERVICE"

	log "Deploy target env: $TARGET_ENV"
	log "Deploy service: $SERVICE"
	log "Compose file: $compose_file"

	if [[ -n "$svc" ]]; then
		docker compose -f "$compose_file" up -d --build "$svc"
	else
		docker compose -f "$compose_file" up -d --build
	fi

	run_post_deploy_health_checks

	log "Deployment finished successfully"
}

main "$@"
