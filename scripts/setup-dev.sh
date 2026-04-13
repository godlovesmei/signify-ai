#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WITH_ML="${WITH_ML:-0}"

log() {
	printf '[setup-dev] %s\n' "$*"
}

require_cmd() {
	if ! command -v "$1" >/dev/null 2>&1; then
		printf '[setup-dev] Missing required command: %s\n' "$1" >&2
		exit 1
	fi
}

ensure_pnpm() {
	if command -v pnpm >/dev/null 2>&1; then
		return
	fi
	if command -v corepack >/dev/null 2>&1; then
		log "pnpm not found, enabling via corepack..."
		corepack enable
		corepack prepare pnpm@9 --activate
		return
	fi
	printf '[setup-dev] pnpm not found and corepack unavailable. Install Node.js with corepack support.\n' >&2
	exit 1
}

conda_env_exists() {
	local env_name="$1"
	conda env list | awk '{print $1}' | grep -Fxq "$env_name"
}

sync_conda_env() {
	local env_name="$1"
	local env_file="$2"

	if conda_env_exists "$env_name"; then
		log "Updating conda env '$env_name' from $env_file"
		conda env update -n "$env_name" -f "$env_file" --prune
	else
		log "Creating conda env '$env_name' from $env_file"
		conda env create -f "$env_file"
	fi
}

main() {
	require_cmd conda
	require_cmd node
	ensure_pnpm

	log "Repository root: $ROOT_DIR"

	sync_conda_env "signify-backend" "$ROOT_DIR/apps/backend/environment.yml"

	if [[ "$WITH_ML" == "1" ]]; then
		sync_conda_env "signify-ml" "$ROOT_DIR/packages/ml/environment.yml"
	else
		log "Skipping ML environment setup. Set WITH_ML=1 to enable."
	fi

	log "Installing frontend dependencies (apps/frontend)..."
	pushd "$ROOT_DIR/apps/frontend" >/dev/null
	pnpm install --frozen-lockfile || pnpm install
	popd >/dev/null

	cat <<'EOF'

[setup-dev] Done.

Next steps:
	1) Backend API:
		 conda run -n signify-backend uvicorn apps.backend.main:app --host 0.0.0.0 --port 8000 --reload

	2) Frontend:
		 cd apps/frontend && pnpm dev

	3) Backend tests:
		 conda run -n signify-backend python -m pytest apps/backend/tests -q

Optional ML environment:
	WITH_ML=1 bash scripts/setup-dev.sh
EOF
}

main "$@"
