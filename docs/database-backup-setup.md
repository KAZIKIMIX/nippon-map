# Supabase database backup (Free plan)

The repository provides `.github/workflows/manual-db-backup.yml` for an **on-demand** backup of the public schema. It is not scheduled and does not run until credentials are configured.

## Setup

1. In Supabase Dashboard > Project Settings > Database, copy a PostgreSQL connection string (use a reachable session pooler connection if direct IPv6 is unavailable). The connection must permit `pg_dump` for the intended objects. Do not paste it into source code, chat, or an issue.
2. In GitHub > repository Settings > Secrets and variables > Actions, create a repository secret named `SUPABASE_DB_URL`.
3. In GitHub > Actions > **Database backup (manual)** > Run workflow, start a run. Confirm it finishes successfully.
4. Download the `nippon-map-db-backup` artifact and store a separate encrypted copy in a location outside GitHub. GitHub Actions artifacts expire after **7 days**.
5. Check `SHA256SUMS`, then use `pg_restore --list nippon-map-public.dump` locally to verify that the archive is readable.

## Recovery validation

For a real restore test, use a **separate disposable PostgreSQL 17 database**, never production. Review the dump manifest before restoring. Restore only after confirming the target is isolated and empty, then compare table counts and key schema objects.

**Scope limitation:** the workflow dumps only PostgreSQL `public` schema objects. It does **not** back up Supabase Auth, Storage objects, Edge Functions, project secrets, or other schemas. `pg_restore --list` checks archive readability, not that the data can be fully restored. A successful test restore and external copy are required before calling backups operational.

**Security:** GitHub Actions artifacts may contain sensitive records. Only authorized repository collaborators should be able to download them. Avoid using untrusted pull-request workflows with this secret. Rotate credentials if accidentally disclosed.
