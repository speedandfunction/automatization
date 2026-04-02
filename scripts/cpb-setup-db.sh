#!/bin/bash
set -eo pipefail

# =============================================================================
# CPB Production Database Setup
# =============================================================================
# Creates the cpb_bot database and cpb_app user on an external PostgreSQL server.
# Idempotent — safe to re-run. Does not modify existing data.
#
# Usage:
#   POSTGRES_PASSWORD_CPB="<password>" CPB_POSTGRES_HOST="<host>" ./scripts/cpb-setup-db.sh
#
# Required env vars:
#   CPB_POSTGRES_HOST    — PostgreSQL server hostname or IP
#   POSTGRES_PASSWORD_CPB — Password for the cpb_app user
#
# Optional env vars:
#   CPB_POSTGRES_PORT       — PostgreSQL port (default: 5432)
#   CPB_POSTGRES_ADMIN_USER — Admin user for psql connection (default: postgres)
#   POSTGRES_DB_CPB         — Database name (default: cpb_bot)
#   POSTGRES_USER_CPB       — Username (default: cpb_app)
# =============================================================================

PGHOST="${CPB_POSTGRES_HOST:?CPB_POSTGRES_HOST is required}"
PGPORT="${CPB_POSTGRES_PORT:-5432}"
PGADMIN_USER="${CPB_POSTGRES_ADMIN_USER:-postgres}"
CPB_DB="${POSTGRES_DB_CPB:-cpb_bot}"
CPB_USER="${POSTGRES_USER_CPB:-cpb_app}"
CPB_PASS="${POSTGRES_PASSWORD_CPB:?POSTGRES_PASSWORD_CPB is required}"

# Validate PostgreSQL identifiers (prevent SQL injection via crafted names)
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
}
validate_pg_identifier "$CPB_USER" "POSTGRES_USER_CPB"
validate_pg_identifier "$CPB_DB" "POSTGRES_DB_CPB"

# Escape single quotes in password for SQL string literal safety
CPB_PASS_SQL="${CPB_PASS//\'/''}"

echo "Setting up CPB database on ${PGHOST}:${PGPORT}..."
echo "  Database: ${CPB_DB}"
echo "  User: ${CPB_USER}"

psql -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PGADMIN_USER" <<-EOSQL
-- Create role if it doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${CPB_USER}') THEN
        CREATE ROLE "${CPB_USER}" WITH LOGIN ENCRYPTED PASSWORD '${CPB_PASS_SQL}';
        RAISE NOTICE 'Created role: ${CPB_USER}';
    ELSE
        RAISE NOTICE 'Role already exists: ${CPB_USER}';
    END IF;
END
\$\$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE "${CPB_DB}" OWNER "${CPB_USER}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${CPB_DB}')\gexec

-- Grant privileges (idempotent)
GRANT ALL PRIVILEGES ON DATABASE "${CPB_DB}" TO "${CPB_USER}";
EOSQL

echo ""
echo "CPB database setup complete."
echo "  Database: ${CPB_DB}"
echo "  User: ${CPB_USER}"
echo "  Host: ${PGHOST}:${PGPORT}"
