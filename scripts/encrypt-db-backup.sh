#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${BACKUP_GPG_PUBLIC_KEY:?Set the backup recipient public key}"
: "${BACKUP_GPG_FINGERPRINT:?Set the expected public-key fingerprint}"
input="${1:?Input archive required}"
output="${2:?Encrypted output required}"
[[ -s "$input" && ! -e "$output" ]] || { echo 'Invalid input or existing output' >&2; exit 1; }
[[ "$BACKUP_GPG_PUBLIC_KEY" == *"-----BEGIN PGP PUBLIC KEY BLOCK-----"* && "$BACKUP_GPG_PUBLIC_KEY" != *"PRIVATE KEY"* ]] || { echo 'Only an armored public key is accepted' >&2; exit 1; }
fingerprint="${BACKUP_GPG_FINGERPRINT^^}"
[[ "$fingerprint" =~ ^([A-F0-9]{40}|[A-F0-9]{64})$ ]] || { echo 'Invalid recipient fingerprint' >&2; exit 1; }
keyring="$(mktemp -d)"
trap 'rm -rf "$keyring"' EXIT
chmod 700 "$keyring"
if ! printf '%s\n' "$BACKUP_GPG_PUBLIC_KEY" | gpg --batch --homedir "$keyring" --import-options import-minimal --import > /dev/null 2> "$keyring/import.log"; then
  echo 'Backup public key could not be imported' >&2
  exit 1
fi
actual="$(gpg --batch --homedir "$keyring" --with-colons --fingerprint --list-keys 2>/dev/null | awk -F: '$1=="fpr" {print $10; exit}')"
[[ "$actual" == "$fingerprint" ]] || { echo 'Backup public key does not match the expected fingerprint' >&2; exit 1; }
gpg --batch --yes --homedir "$keyring" --trust-model always --recipient "$fingerprint" --output "$output" --encrypt "$input"
test -s "$output"
