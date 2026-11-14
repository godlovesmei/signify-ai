"""Test repo migrations and RLS in a disposable DB on the existing local Docker stack."""
import argparse
import json
from pathlib import Path
import re
import subprocess
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[3]
DOCKER = ["docker", "--host", "unix:///var/run/docker.sock"]
CONTAINER = "supabase_db_signify-supabase-local"


def sql(database, source):
    return subprocess.run(DOCKER + ["exec", "-i", CONTAINER, "psql", "-X", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", database],
        input=source, text=True, capture_output=True, timeout=90)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allow-local-test-db", action="store_true", required=True)
    parser.parse_args()
    result = subprocess.run(DOCKER + ["inspect", CONTAINER], text=True, capture_output=True, check=True)
    data = json.loads(result.stdout)[0]
    assert data["Config"]["Labels"]["com.supabase.cli.project"] == "signify-supabase-local"
    assert list(data["NetworkSettings"]["Networks"]) == ["signify-local-only"]
    name = "signify_curator_test_" + uuid4().hex
    assert re.fullmatch(r"signify_curator_test_[0-9a-f]{32}", name)
    created = False
    try:
        result = sql("postgres", 'create database "' + name + '";')
        if result.returncode: raise RuntimeError("Cannot create isolated test database")
        created = True
        bootstrap = """
create schema auth; create schema storage; create schema extensions;
grant usage on schema public,auth,storage,extensions to anon,authenticated,service_role;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
create table auth.users(id uuid primary key,email text unique,raw_user_meta_data jsonb not null default '{}');
create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid; $$;
create table storage.buckets(id text primary key,name text not null,public boolean not null default false);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text not null references storage.buckets(id),name text not null,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant all on storage.objects to anon,authenticated,service_role;
"""
        result = sql(name, bootstrap)
        if result.returncode: raise RuntimeError(result.stderr)
        for migration in sorted((ROOT / "supabase/migrations").glob("*.sql")):
            if migration.name >= '20261112090000_curator_profile_role.sql':
                continue
            result = sql(name, migration.read_text())
            if result.returncode: raise RuntimeError(migration.name + ": " + result.stderr)
        assertions = 0
        for filename in ("production_data_sync.test.sql", "dataset_foundation.test.sql", "dataset_curator_roles.test.sql"):
            result = sql(name, "set search_path=public,extensions;\n" + (ROOT / "supabase/tests/database" / filename).read_text())
            if result.returncode: raise RuntimeError(filename + ": " + result.stderr)
            failures = [line.strip() for line in result.stdout.splitlines() if "not ok " in line or "# Failed" in line or "# Looks like" in line]
            assertions += sum(bool(re.search(r"\bok [0-9]+ -", line)) for line in result.stdout.splitlines())
            if failures: raise RuntimeError(filename + ": " + " | ".join(failures))
            print(filename + ": PASS")
        print(str(assertions) + " SQL/RLS assertions passed; live application database unchanged.")
        # Earlier suites verify their historical migration contract. Then verify
        # the operator-managed profile role against the final schema separately.
        for migration in sorted((ROOT / "supabase/migrations").glob("*.sql")):
            if migration.name < '20261112090000_curator_profile_role.sql':
                continue
            result = sql(name, migration.read_text())
            if result.returncode: raise RuntimeError(migration.name + ': ' + result.stderr)
        result = sql(name, 'set search_path=public,extensions;\n' + (ROOT / 'supabase/tests/database/curator_profile_role.test.sql').read_text())
        if result.returncode: raise RuntimeError(result.stderr)
        failures = [line.strip() for line in result.stdout.splitlines() if 'not ok ' in line or '# Failed' in line or '# Looks like' in line]
        if failures: raise RuntimeError(' | '.join(failures))
        print(result.stdout)
    finally:
        if created:
            result = sql("postgres", 'drop database "' + name + '" with (force);')
            if result.returncode: raise RuntimeError("Disposable test database cleanup failed")


if __name__ == "__main__":
    main()
