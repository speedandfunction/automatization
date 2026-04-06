#!/bin/bash
set -eo pipefail

# =============================================================================
# CPB Production Database Setup
# =============================================================================
# Creates the cpb_bot database on an external PostgreSQL (RDS) server using the
# temporal user (which has CREATEDB privilege). Grants access to the n8n user
# so the CPB application (running inside n8n) can manage its tables.
#
# Ownership model:
#   - temporal creates and owns the database (only user with CREATEDB)
#   - n8n gets ALL PRIVILEGES on the database to create/manage tables
#   - Later, when DevOps provides the master password, ownership can be
#     migrated to a dedicated cpb_app user
#
# PostgreSQL version notes:
#   - PG14: public schema grants CREATE to PUBLIC by default — n8n can create
#     tables without explicit schema grants
#   - PG15+: CREATE on public schema is revoked by default — the script
#     attempts to grant schema privileges and warns if it cannot (the DB owner
#     can do this on PG15+ since public schema is owned by pg_database_owner)
#
# Usage:
#   CPB_POSTGRES_HOST="<host>" POSTGRES_PASSWORD_TEMPORAL="<pw>" \
#     POSTGRES_USER_N8N="n8n" ./scripts/cpb-setup-db.sh
#
# Required env vars:
#   CPB_POSTGRES_HOST          — PostgreSQL server hostname or IP
#   POSTGRES_PASSWORD_TEMPORAL — Password for the temporal user
#
# Optional env vars:
#   CPB_POSTGRES_PORT          — PostgreSQL port (default: 5432)
#   POSTGRES_USER_TEMPORAL     — Temporal user name (default: temporal)
#   POSTGRES_USER_N8N          — n8n user to grant access to (default: n8n)
#   POSTGRES_DB_CPB            — Database name (default: cpb_bot)
# =============================================================================

PGHOST="${CPB_POSTGRES_HOST:?CPB_POSTGRES_HOST is required}"
PGPORT="${CPB_POSTGRES_PORT:-5432}"
TEMPORAL_USER="${POSTGRES_USER_TEMPORAL:-temporal}"
N8N_USER="${POSTGRES_USER_N8N:-n8n}"
CPB_DB="${POSTGRES_DB_CPB:-cpb_bot}"

TEMPORAL_PASS="${POSTGRES_PASSWORD_TEMPORAL:?POSTGRES_PASSWORD_TEMPORAL is required}"

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
    return 0
}
validate_pg_identifier "$TEMPORAL_USER" "POSTGRES_USER_TEMPORAL"
validate_pg_identifier "$N8N_USER" "POSTGRES_USER_N8N"
validate_pg_identifier "$CPB_DB" "POSTGRES_DB_CPB"

echo "Setting up CPB database on ${PGHOST}:${PGPORT}..."
echo "  Database:  ${CPB_DB}"
echo "  Owner:     ${TEMPORAL_USER} (interim — migrate to dedicated user later)"
echo "  Grantee:   ${N8N_USER}"

# --- Step 1: Create database and grant database-level privileges -----------
# Connect to the 'postgres' maintenance database to run DDL.
# CREATE DATABASE cannot run inside a transaction, so we use \gexec.
PGPASSWORD="${TEMPORAL_PASS}" psql -v ON_ERROR_STOP=1 \
    -h "$PGHOST" -p "$PGPORT" -U "$TEMPORAL_USER" -d postgres <<-EOSQL
-- Create database if it doesn't exist (temporal becomes owner)
SELECT 'CREATE DATABASE "${CPB_DB}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${CPB_DB}')\gexec

-- Grant all database-level privileges to n8n (idempotent)
GRANT ALL PRIVILEGES ON DATABASE "${CPB_DB}" TO "${N8N_USER}";
EOSQL

# --- Step 2: Grant schema-level privileges ---------------------------------
# On PG14, this is unnecessary (PUBLIC has CREATE on public schema by default)
# but we attempt it for forward-compatibility with PG15+ where it IS required.
# temporal cannot grant on public schema in PG14 (owned by postgres), so we
# handle the error gracefully.
SCHEMA_GRANT_ERR=$(PGPASSWORD="${TEMPORAL_PASS}" psql -v ON_ERROR_STOP=1 \
    -h "$PGHOST" -p "$PGPORT" -U "$TEMPORAL_USER" -d "$CPB_DB" \
    -c "GRANT ALL ON SCHEMA public TO \"${N8N_USER}\";" 2>&1) && \
    echo "  Schema grant on public: OK" || {
    if echo "$SCHEMA_GRANT_ERR" | grep -qi "permission denied\|must be owner"; then
        echo "  Schema grant on public: skipped (not needed on PG14 — PUBLIC has CREATE by default)"
        echo "  NOTE: After upgrading to PG15+, re-run this script or grant manually:"
        echo "    GRANT ALL ON SCHEMA public TO \"${N8N_USER}\";"
    else
        echo "ERROR: Schema grant failed unexpectedly:" >&2
        echo "  $SCHEMA_GRANT_ERR" >&2
        exit 1
    fi
}

echo ""
echo "CPB database setup complete."
echo "  Database: ${CPB_DB}"
echo "  Owner:    ${TEMPORAL_USER}"
echo "  Access:   ${N8N_USER} (all privileges)"
echo "  Host:     ${PGHOST}:${PGPORT}"
