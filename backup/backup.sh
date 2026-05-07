#!/bin/bash
set -euo pipefail

OUT_DIR="/opt/lojixfm-backups"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
mkdir -p "$OUT_DIR"

echo "Dumping Postgres DB..."
PG_USER=${DB_USER:-lojix}
PG_DB=lojixfm
docker exec -t lojix-postgres pg_dump -U "$PG_USER" "$PG_DB" > "$OUT_DIR/lojixfm-${TIMESTAMP}.sql"

echo "Syncing music and tts caches to backups..."
docker run --rm -v lojixfm_music-library:/from -v "$OUT_DIR":/to alpine sh -c "cp -a /from /to/music_${TIMESTAMP} || true"
docker run --rm -v tts-cache:/from -v "$OUT_DIR":/to alpine sh -c "cp -a /from /to/tts_${TIMESTAMP} || true"

echo "Backup complete: $OUT_DIR"
