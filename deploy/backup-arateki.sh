#!/usr/bin/env bash
set -euo pipefail
DB=/var/lib/arateki/arateki.db
DEST=/var/backups/arateki
mkdir -p "$DEST"
sqlite3 "$DB" ".backup '$DEST/arateki-$(date +%F).db'"
# retenção: manter os últimos 14 backups
ls -1t "$DEST"/arateki-*.db | tail -n +15 | xargs -r rm --
