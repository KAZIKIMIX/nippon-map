# Encrypted Supabase public-schema backup

The manual workflow `.github/workflows/manual-db-backup.yml` is not a scheduled backup and has not yet been verified against production credentials. Do not treat its existence as a successful production backup.

## Configure once

1. On an operator-controlled computer, create a GnuPG encryption-capable key using `gpg --full-generate-key`. Keep its private key and recovery material outside GitHub. Verify that the private key can decrypt a test message.
2. Record the full primary fingerprint with `gpg --fingerprint`. Export only the public key with `gpg --armor --export FULL_FINGERPRINT`.
3. Set repository variables `BACKUP_GPG_PUBLIC_KEY` (armored public key) and `BACKUP_GPG_FINGERPRINT` (full uppercase fingerprint without spaces). Never supply a private key to Actions.
4. Set repository Actions secret `SUPABASE_DB_URL` to an appropriate Supabase Postgres connection string. Never paste it into issues, logs or chat.
5. Run **Database backup (manual)** once and verify its result before relying on it.

## Privacy and export

This repository is public. GitHub artifacts are downloadable by signed-in users with repository read access; an artifact name containing “private” does not restrict access. The workflow therefore exports plaintext only into a temporary runner directory, encrypts to the pinned recipient public key, removes temporary plaintext even on failure, and uploads only the encrypted dump and its SHA-256 checksum. Missing or mismatched keys stop the job.

The dump contains the complete `public` schema, potentially including non-public submissions and contact data. Keep decryption keys and decrypted files restricted. An encrypted artifact is retained for seven days; download and retain a separate protected copy according to an explicit retention policy.

## Verify and restore in isolation

After downloading and extracting `nippon-map-db-backup-encrypted`, on the trusted operator computer:

```sh
sha256sum --check SHA256SUMS
gpg --output nippon-map-public.dump --decrypt nippon-map-public.dump.gpg
pg_restore --list nippon-map-public.dump
```

Restore only into a disposable PostgreSQL 17 database with required compatible extensions, never production. Validate tables, counts, constraints, representative data and application read paths. Record timestamps, backup hash, restore result and discrepancies. Delete decrypted temporary copies securely under the operator’s storage policy. A checksum and archive listing alone are not a restoration test.

## Scope and current verification

This public-schema dump does not independently protect Auth, Storage objects, Edge Functions, secrets, project configuration or all service roles. It is not a complete Supabase disaster-recovery backup. Full project recovery and production backup scheduling remain separate operational tasks.

`tests/backup-encryption.test.cjs` exercises public-key encryption, fixture decryption, recipient mismatch, missing-key refusal and no-overwrite behavior without production data. A three-park guarded row restoration was separately verified on a temporary table; that does not prove full-database restoration.

References: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts ; https://www.gnupg.org/documentation/manuals/gnupg/GPG-Examples.html ; https://supabase.com/docs/guides/platform/backups
