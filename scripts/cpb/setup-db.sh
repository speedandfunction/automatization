#!/bin/bash
set -eo pipefail

# =============================================================================
# CPB Schema Setup
# =============================================================================
# Connects to the cpb_bot database as the cpb_app role and applies the
# init-schema.sql file to create tables, indexes, and triggers.
#
# Prerequisites:
#   - Role cpb_app and database cpb_bot must already exist.
#     Run create-role.sh first if they don't.
#
# Idempotency:
#   - Safe to re-run. All DDL uses IF NOT EXISTS / CREATE OR REPLACE.
#
# Usage:
#   CPB_POSTGRES_HOST="<host>" POSTGRES_PASSWORD_CPB="<pw>" \
#     ./scripts/cpb/setup-db.sh
#
# Required env vars:
#   CPB_POSTGRES_HOST      — PostgreSQL server hostname or IP
#   POSTGRES_PASSWORD_CPB  — Password for the cpb_app role
#
# Optional env vars:
#   CPB_POSTGRES_PORT      — PostgreSQL port (default: 5432)
#   POSTGRES_USER_CPB      — CPB role name (default: cpb_app)
#   POSTGRES_DB_CPB        — Database name (default: cpb_bot)
# =============================================================================

# --- Required env vars (fail immediately if missing) --------------------------
PGHOST="${CPB_POSTGRES_HOST:?CPB_POSTGRES_HOST is required}"
CPB_PASS="${POSTGRES_PASSWORD_CPB:?POSTGRES_PASSWORD_CPB is required}"

# --- Optional env vars with defaults -----------------------------------------
PGPORT="${CPB_POSTGRES_PORT:-5432}"
CPB_USER="${POSTGRES_USER_CPB:-cpb_app}"
CPB_DB="${POSTGRES_DB_CPB:-cpb_bot}"

# --- Resolve script directory for locating SQL files --------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCHEMA_FILE="${REPO_ROOT}/sql/cpb/init-schema.sql"

# --- Validate identifiers (prevent SQL injection via crafted names) -----------
validate_pg_identifier() {
    local value="$1" name="$2"
    if [[ -z "$value" ]]; then
        echo "ERROR: ${name} cannot be empty" >&2; exit 1
    fi
    if [[ ${#value} -gt 63 ]]; then
        echo "ERROR: ${name} exceeds PostgreSQL's 63-char identifier limit" >&2; exit 1
    fi
    if [[ ! "$value" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
        echo "ERROR: ${name} contains invalid characters (must match ^[a-zA-Z_][a-zA-Z0-9_]*$)" >&2; exit 1
    fi
    return 0
}
validate_pg_identifier "$CPB_USER" "POSTGRES_USER_CPB"
validate_pg_identifier "$CPB_DB" "POSTGRES_DB_CPB"

# --- Verify schema file exists ------------------------------------------------
if [[ ! -f "$SCHEMA_FILE" ]]; then
    echo "ERROR: Schema file not found: ${SCHEMA_FILE}" >&2
    echo "  Expected at: sql/cpb/init-schema.sql (relative to repo root)" >&2
    exit 1
fi

echo "=== CPB Schema Setup ==="
echo "  Host:     ${PGHOST}:${PGPORT}"
echo "  User:     ${CPB_USER}"
echo "  Database: ${CPB_DB}"
echo "  Schema:   ${SCHEMA_FILE}"
echo ""

# --- Step 1: Verify connectivity ---------------------------------------------
echo "Step 1: Verifying database connection..."
if ! CONN_ERR=$(PGPASSWORD="${CPB_PASS}" psql -v ON_ERROR_STOP=1 \
    -h "$PGHOST" -p "$PGPORT" -U "$CPB_USER" -d "$CPB_DB" \
    -c "SELECT 1;" 2>&1 >/dev/null); then
    echo "ERROR: Cannot connect to ${CPB_DB} as ${CPB_USER}" >&2
    echo "  psql: ${CONN_ERR}" >&2
    echo "  Have you run create-role.sh first?" >&2
    exit 1
fi
echo "  Connection: OK"

# --- Step 2: Apply schema ----------------------------------------------------
echo "Step 2: Applying schema from init-schema.sql..."
PGPASSWORD="${CPB_PASS}" psql -v ON_ERROR_STOP=1 \
    -h "$PGHOST" -p "$PGPORT" -U "$CPB_USER" -d "$CPB_DB" \
    -f "$SCHEMA_FILE"
echo "  Schema applied: OK"

# --- Step 3: Verify tables were created ---------------------------------------
echo "Step 3: Verifying tables..."
TABLE_COUNT=$(PGPASSWORD="${CPB_PASS}" psql -v ON_ERROR_STOP=1 -t -A \
    -h "$PGHOST" -p "$PGPORT" -U "$CPB_USER" -d "$CPB_DB" \
    -c "SELECT count(*) FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name IN (
              'cycles', 'opt_in_responses', 'pairings',
              'pair_history', 'interactions', 'admin_reports'
          );")

if [[ "$TABLE_COUNT" -eq 6 ]]; then
    echo "  All 6 tables verified: OK"
else
    echo "ERROR: Expected 6 tables, found ${TABLE_COUNT}" >&2
    echo "  Re-run the psql command manually with -v to investigate" >&2
    exit 1
fi

echo ""
echo "=== Schema setup complete ==="
echo "  Database: ${CPB_DB}"
echo "  User:     ${CPB_USER}"
echo "  Tables:   ${TABLE_COUNT}/6"
echo "  Host:     ${PGHOST}:${PGPORT}"
