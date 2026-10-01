#!/bin/bash
# LCFLIGHT - Development startup script
# Starts PostgreSQL + backend

LCFLIGHT_DIR="$(cd "$(dirname "$0")" && pwd)"
PGDATA="$LCFLIGHT_DIR/pgdata"
SOCKDIR="$LCFLIGHT_DIR/pgsock"
export DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5432/lcf_management"

# Start PostgreSQL if not running
if ! pg_isready -h 127.0.0.1 -q 2>/dev/null; then
  echo "Starting PostgreSQL..."
  /usr/lib/postgresql/16/bin/pg_ctl -D "$PGDATA" -l "$PGDATA/pg.log" start -o "-c unix_socket_directories=$SOCKDIR" 2>&1
  sleep 2
  /usr/lib/postgresql/16/bin/createdb -h 127.0.0.1 -U postgres lcf_management 2>/dev/null || true
fi

# Start backend
echo "Starting LCFLIGHT backend..."
cd "$LCFLIGHT_DIR/backend"
npx tsx src/app.ts