# Local Supabase Auth and Storage integration tests

This opt-in script exercises the running Supabase stack at 127.0.0.1:55431.
It does not start/stop services, run migrations, read .env files, use a remote
Docker context, or change database schema/RLS definitions.

Prerequisites: Python 3.11+, the local Docker Unix socket in Ubuntu WSL, project
/home/bunga/signify-supabase-local, network signify-local-only, and all repository
migrations already applied to the isolated PostgreSQL 15 stack.

Run from PowerShell:

~~~powershell
rtk proxy wsl -d Ubuntu -- python3 /home/bunga/pbl-project/signify-ai/supabase/tests/integration/test_auth_storage_local.py --allow-local-fixtures
~~~

Every request is restricted to the fixed local API origin. HTTP redirects and
environment proxies are disabled. API keys are read from the local Studio
container and checked against the local Auth signing secret. Passwords, tokens,
service keys, signing secrets, and signed-URL query tokens are never written to
the report or console. No credentials are accepted through command arguments.

Fixtures consist of five new Auth accounts (two contributors, two curators and
one technical admin), two labels, four contributions, and two synthetic 18,712-byte
AVI objects. They are identified by a unique run_id. A synthetic technical policy
is activated only if no active policy exists; an existing policy is never replaced
or deactivated. The AVI is generated entirely from colored frames, without using
any person's recording. This tests authorization, not future backend video decoding.

At completion, only this run's temporary curator grants are revoked and its new
technical policy/labels are deactivated. Accounts, contributions, audit records,
and private objects are retained for inspection. No pre-existing rows are deleted.
No audit triggers or RLS policies are disabled for fixture cleanup.

Reports are written exclusively to results/auth-storage-<run_id>.json.
An exit code of 1 indicates a failed check or aborted run; failures are preserved.

Verified run: 20261030T023801Z-f37d8d65

- Runtime: actual PostgreSQL 15.19; Storage API v1.84.19; PostgREST v16.5.
- Result: 81 PASS, 1 FAIL across 82 checks.
- Auth Admin user creation, password login, user identity, ownership RLS,
  unauthorized role/approval writes, private Storage reads/lists, direct-upload
  denial, overwrite denial, signed URL creation/expiry, and invalid/expired JWT
  rejection all passed.
- Two independent PostgreSQL sessions (backend PIDs 1814 and 1821) demonstrated
  a real row-lock wait, one committed review, and SQLSTATE 40001 for the stale
  attempt. Only one review/notification was created and revision became 2.
- The parallel HTTP test preserved the same data invariants, but PostgREST returned
  HTTP 500 for SQLSTATE 40001, where the harness's conflict-response criterion
  expects HTTP 409. This is the one FAIL, not an authorization bypass. No migration
  was changed. A future FastAPI adapter should map this SQLSTATE to a conflict
  response; changing the existing RPC SQLSTATE requires separate review/approval.
- Fingerprints of dataset RLS policies and functions, plus migration file hashes,
  were unchanged before/after the run.

Signed URLs are bearer capabilities: a valid URL works without an Authorization
header until expiry. The tests confirm that unauthorized actors cannot mint such
a URL, and that the generated short-lived URL stops working after expiry.

Scope limits: no OAuth/browser callback flow, recorder, FastAPI ingestion endpoint,
media-quality validation, archive generation, or archive-object HTTP access is
tested. Both bucket privacy flags are checked; object-level HTTP tests target
dataset-contribution-videos. The previous 141 SQL checks are a separate suite and
were not rerun or included in the 82 checks above.


As of the 11 November 2026 role migration, curator fixtures retain `profiles.role = user`; only the technical admin fixture becomes an administrator. Curator grants no longer confer export/admin access. The opt-in HTTP fixture suite retains its generated accounts and must not be run merely to preview the panel. Use `tests/support/test_curator_roles_local.py --allow-local-test-db` for disposable SQL/RLS verification.
