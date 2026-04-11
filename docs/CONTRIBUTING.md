# Contributing to Signify AI

## Scope
This project accepts contributions for frontend, backend API, ML tooling, and platform automation.
Core constraints:
- Do not replace the current EfficientNetV2B0-based pipeline.
- Keep backend and frontend preprocessing contracts aligned.

## Development Setup
Run from repository root:

```bash
bash scripts/setup-dev.sh
```

Include ML environment only when needed:

```bash
WITH_ML=1 bash scripts/setup-dev.sh
```

## Branch and Commit Convention
- Branch pattern: `feat/<scope>-<short-name>`, `fix/<scope>-<short-name>`, `chore/<scope>-<short-name>`
- Keep commits focused and atomic.
- Use clear commit messages that describe user impact.

## Required Checks Before Pull Request
Run all commands from repository root unless stated otherwise.

### Backend
```bash
conda run -n signify-backend python -m pytest apps/backend/tests -q
```

### Frontend
```bash
cd apps/frontend
pnpm test
pnpm lint
pnpm build
```

### ML Scripts Syntax Smoke Check
```bash
python -m compileall packages/ml scripts
```

### Security Checks (recommended before dependency changes)
```bash
conda run -n signify-backend python -m pip install pip-audit
conda run -n signify-backend pip-audit

cd apps/frontend
pnpm audit --prod --audit-level=high
```

Repository workflow note:
- `Security Scan` runs in non-blocking mode on pull requests.
- Add PR label `security-strict` to make `Security Scan` blocking for that pull request.
- On push to `main`, `Security Scan` is blocking by default.
- For release hardening, run `Security Scan` manually with `strict=true` so audit findings fail the workflow.

## Pull Request Checklist
- PR is scoped to one concern.
- Local checks pass for touched areas.
- Documentation is updated for behavior changes.
- New environment variables are documented in `.env` examples.
- Breaking changes are explicitly called out in PR description.

## Testing Expectations
- Add or update tests for behavior changes.
- Preserve existing backend integration tests and extend them when API behavior changes.
- For frontend state/logic changes, prefer deterministic unit tests over manual-only verification.

## Security and Data Handling
- Never commit secrets, private keys, or model artifacts intended to stay outside Git.
- Keep auth-related changes backward compatible unless migration steps are provided.
- Validate external input paths and file uploads rigorously.

## Review Notes
- Include reproduction steps for bugs.
- Include verification steps for feature PRs.
- Attach screenshots or short recordings for UI changes when relevant.
