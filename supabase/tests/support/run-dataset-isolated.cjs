/* In-memory SQL/RLS compatibility harness. Never reads .env or opens a DB URL.
 * Usage: node supabase/tests/support/run-dataset-isolated.cjs <temporary npm prefix>
 * Dependencies stay outside the repository. Auth/Storage are compatibility fixtures.
 */
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

async function main() {
  if (!process.argv[2]) throw new Error('Pass the temporary prefix containing PGlite and pglite-pgtap.');
  const dependencyRoot = path.resolve(process.argv[2]);
  const dependencyRequire = createRequire(path.join(dependencyRoot, 'package.json'));
  const { PGlite } = dependencyRequire('@electric-sql/pglite');
  const { pgcrypto } = dependencyRequire('@electric-sql/pglite/contrib/pgcrypto');
  const { pgtap } = dependencyRequire('@electric-sql/pglite-pgtap');
  const repositoryRoot = path.resolve(__dirname, '../../..');
  const db = new PGlite({ extensions: { pgcrypto, pgtap } });
  let currentFile = 'compatibility bootstrap';
  try {
    console.log('Isolated in-memory PostgreSQL; no remote connection or database reset.');
    console.log('Auth/Storage compatibility fixtures; HTTP Storage and signed URLs are not tested.');
    console.log((await db.query('select version() as version')).rows[0].version);
    for (const name of ['@electric-sql/pglite', '@electric-sql/pglite-pgtap']) {
      const manifest = JSON.parse(fs.readFileSync(path.join(dependencyRoot, 'node_modules', name, 'package.json'), 'utf8'));
      console.log(name + ' ' + manifest.version);
    }
    await db.exec([
      'create role anon nologin;',
      'create role authenticated nologin;',
      'create role service_role nologin bypassrls;',
      'create schema auth;',
      'create schema storage;',
      'create schema extensions;',
      'grant usage on schema public, auth, storage, extensions to anon, authenticated, service_role;',
      'alter default privileges in schema public grant all on tables to anon, authenticated, service_role;',
      "create table auth.users (id uuid primary key, email text unique, raw_user_meta_data jsonb not null default '{}');",
      "create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid; $$;",
      'create table storage.buckets (id text primary key, name text not null, public boolean not null default false);',
      'create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text not null references storage.buckets(id), name text not null, unique (bucket_id, name));',
      'alter table storage.objects enable row level security;',
      'grant all on storage.objects to anon, authenticated, service_role;',
      'set search_path = public, extensions;',
    ].join('\n'));
    const migrationDirectory = path.join(repositoryRoot, 'supabase/migrations');
    const migrations = fs.readdirSync(migrationDirectory).filter(name => name.endsWith('.sql')).sort();
    for (const name of migrations) {
      currentFile = name;
      await db.exec(fs.readFileSync(path.join(migrationDirectory, name), 'utf8'));
      console.log('Applied in memory: ' + name);
    }
    let failures = 0;
    let assertions = 0;
    for (const name of ['production_data_sync.test.sql', 'dataset_foundation.test.sql', 'dataset_curator_roles.test.sql']) {
      currentFile = name;
      console.log('Suite: ' + name);
      const results = await db.exec(fs.readFileSync(path.join(repositoryRoot, 'supabase/tests/database', name), 'utf8'));
      for (const result of results) {
        for (const row of result.rows) {
          for (const value of Object.values(row)) {
            if (typeof value !== 'string') continue;
            for (const line of value.split('\n')) {
              if (/^(ok |not ok |[0-9]+\.\.|#)/.test(line)) console.log(line);
              if (/^(ok |not ok )/.test(line)) assertions++;
              if (/^not ok /.test(line) || /^# Looks like/.test(line)) failures++;
            }
          }
        }
      }
    }
    console.log('Assertions: ' + assertions + '; failures: ' + failures);
    if (failures) process.exitCode = 1;
  } catch (error) {
    console.error('Failed in ' + currentFile + ': ' + error.message);
    if (error.code) console.error('SQLSTATE: ' + error.code);
    if (error.position && error.query) {
      const position = Number(error.position);
      console.error('SQL near position ' + position + ': ' + error.query.slice(Math.max(0, position - 100), position + 160));
    }
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
