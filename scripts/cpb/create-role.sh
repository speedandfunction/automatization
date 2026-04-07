#!/bin/bash
set -eo pipefail

# =============================================================================
# CPB Role & Database Provisioning (one-time setup)
# =============================================================================
# Connects to an external PostgreSQL (RDS) server using the master password to
# create a dedicated cpb_app role and cpb_bot database. This replaces the
# interim approach of using the temporal user as database owner.
#
# Designed as a one-time provisioning tool:
#   1. Run this script with the RDS master password
#   2. Run setup-db.sh to create the schema
#   3. Remove the master password from your environment
#
# Idempotency:
#   - Safe to re-run. Existing role gets its password updated; existing
#     database is left untouched; ownership is transferred only if needed.
#
# Usage:
#   CPB_POSTGRES_HOST="<host>" \
#   POSTGRES_PASSWORD_MASTER="<master_pw>" \
#   POSTGRES_PASSWORD_CPB="<cpb_pw>" \
#     ./scripts/cpb/create-role.sh
#
# Required env vars:
#   CPB_POSTGRES_HOST        — PostgreSQL server hostname or IP
#   POSTGRES_PASSWORD_MASTER — RDS master (postgres) password
#   POSTGRES_PASSWORD_CPB    — Password to assign to the cpb_app role
#
# Optional env vars:
#   CPB_POSTGRES_PORT        — PostgreSQL port (default: 5432)
#   POSTGRES_USER_MASTER     — Master user name (default: postgres)
#   POSTGRES_USER_CPB        — CPB role name (default: cpb_app)
#   POSTGRES_DB_CPB          — Database name (default: cpb_bot)
# =============================================================================

# --- Required env vars (fail immediately if missing) --------------------------
PGHOST="${CPB_POSTGRES_HOST:?CPB_POSTGRES_HOST is required}"
MASTER_PASS="${POSTGRES_PASSWORD_MASTER:?POSTGRES_PASSWORD_MASTER is required}"
CPB_PASS="${POSTGRES_PASSWORD_CPB:?POSTGRES_PASSWORD_CPB is required}"

# --- Optional env vars with defaults -----------------------------------------
PGPORT="${CPB_POSTGRES_PORT:-5432}"
MASTER_USER="${POSTGRES_USER_MASTER:-postgres}"
CPB_USER="${POSTGRES_USER_CPB:-cpb_app}"
CPB_DB="${POSTGRES_DB_CPB:-cpb_bot}"

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
validate_pg_identifier "$MASTER_USER" "POSTGRES_USER_MASTER"
validate_pg_identifier "$CPB_USER" "POSTGRES_USER_CPB"
validate_pg_identifier "$CPB_DB" "POSTGRES_DB_CPB"

# --- Escape single quotes in passwords for safe SQL embedding -----------------
# Also reject passwords containing $$ which would break PL/pgSQL dollar-quoting
if [[ "$CPB_PASS" == *'$$'* ]]; then
    echo "ERROR: POSTGRES_PASSWORD_CPB must not contain '\$\$' (breaks PL/pgSQL quoting)" >&2
    exit 1
fi
ESCAPED_CPB_PASS="${CPB_PASS//\'/''}"

echo "=== CPB Role & Database Provisioning ==="
echo "  Host:     ${PGHOST}:${PGPORT}"
echo "  Master:   ${MASTER_USER}"
echo "  Role:     ${CPB_USER}"
echo "  Database: ${CPB_DB}"
echo ""

# --- Step 1: Create role (idempotent) ----------------------------------------
# If the role already exists, update its password to converge to desired state.
echo "Step 1: Ensuring role '${CPB_USER}' exists..."
PGPASSWORD="${MASTER_PASS}" psql -v ON_ERROR_STOP=1 \
    -h "$PGHOST" -p "$PGPORT" -U "$MASTER_USER" -d postgres <<-EOSQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${CPB_USER}') THEN
        CREATE ROLE "${CPB_USER}" LOGIN ENCRYPTED PASSWORD '${ESCAPED_CPB_PASS}';
        RAISE NOTICE 'Created role ${CPB_USER}';
    ELSE
        ALTER ROLE "${CPB_USER}" WITH LOGIN ENCRYPTED PASSWORD '${ESCAPED_CPB_PASS}';
        RAISE NOTICE 'Role ${CPB_USER} already exists — password updated';
    END IF;
END
\$\$;
EOSQL
echo "  Role '${CPB_USER}': OK"

# --- Step 2: Create database (idempotent) ------------------------------------
echo "Step 2: Ensuring database '${CPB_DB}' exists..."
PGPASSWORD="${MASTER_PASS}" psql -v ON_ERROR_STOP=1 \
    -h "$PGHOST" -p "$PGPORT" -U "$MASTER_USER" -d postgres <<-EOSQL
SELECT 'CREATE DATABASE "${CPB_DB}" OWNER "${CPB_USER}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${CPB_DB}')\gexec
EOSQL
echo "  Database '${CPB_DB}': OK"

# --- Step 3: Transfer ownership if needed (idempotent) -----------------------
echo "Step 3: Ensuring '${CPB_USER}' owns '${CPB_DB}'..."
PGPASSWORD="${MASTER_PASS}" psql -v ON_ERROR_STOP=1 \
    -h "$PGHOST" -p "$PGPORT" -U "$MASTER_USER" -d postgres <<-EOSQL
DO \$\$
DECLARE
    current_owner TEXT;
BEGIN
    SELECT pg_catalog.pg_get_userbyid(d.datdba) INTO current_owner
    FROM pg_database d WHERE d.datname = '${CPB_DB}';

    IF current_owner IS NULL THEN
        RAISE EXCEPTION 'Database ${CPB_DB} not found — this should not happen';
    ELSIF current_owner = '${CPB_USER}' THEN
        RAISE NOTICE 'Database ${CPB_DB} already owned by ${CPB_USER}';
    ELSE
        EXECUTE 'ALTER DATABASE "${CPB_DB}" OWNER TO "${CPB_USER}"';
        RAISE NOTICE 'Transferred ownership from % to ${CPB_USER}', current_owner;
    END IF;
END
\$\$;
EOSQL
echo "  Ownership: OK"

# --- Step 3b: Reassign object ownership within database (idempotent) ---------
# ALTER DATABASE OWNER only transfers the database-level ownership. Objects
# inside (tables, sequences, functions, triggers) keep their original owner.
# On migration from old setup (temporal/n8n owned objects), reassign them all.
echo "  Reassigning objects within '${CPB_DB}'..."
PGPASSWORD="${MASTER_PASS}" psql -v ON_ERROR_STOP=1 \
    -h "$PGHOST" -p "$PGPORT" -U "$MASTER_USER" -d "$CPB_DB" <<-EOSQL
DO \$\$
DECLARE
    role_name TEXT;
BEGIN
    FOR role_name IN
        SELECT DISTINCT r.rolname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_roles r ON r.oid = c.relowner
        WHERE n.nspname = 'public'
          AND r.rolname NOT IN ('${CPB_USER}', '${MASTER_USER}')
    LOOP
        EXECUTE format('REASSIGN OWNED BY %I TO %I', role_name, '${CPB_USER}');
        RAISE NOTICE 'Reassigned objects from % to ${CPB_USER}', role_name;
    END LOOP;
END
\$\$;
EOSQL
echo "  Object ownership: OK"

# --- Step 4: Grant database-level privileges (idempotent) --------------------
echo "Step 4: Granting database privileges..."
PGPASSWORD="${MASTER_PASS}" psql -v ON_ERROR_STOP=1 \
    -h "$PGHOST" -p "$PGPORT" -U "$MASTER_USER" -d postgres <<-EOSQL
GRANT ALL PRIVILEGES ON DATABASE "${CPB_DB}" TO "${CPB_USER}";
EOSQL
echo "  Database GRANT: OK"

# --- Step 5: Grant schema-level privileges (idempotent) ----------------------
# As superuser we can always grant on public schema, regardless of PG version.
echo "Step 5: Granting schema privileges on '${CPB_DB}'..."
PGPASSWORD="${MASTER_PASS}" psql -v ON_ERROR_STOP=1 \
    -h "$PGHOST" -p "$PGPORT" -U "$MASTER_USER" -d "$CPB_DB" <<-EOSQL
GRANT ALL ON SCHEMA public TO "${CPB_USER}";
EOSQL
echo "  Schema GRANT: OK"

echo ""
echo "=== Provisioning complete ==="
echo "  Role:     ${CPB_USER} (LOGIN)"
echo "  Database: ${CPB_DB} (owned by ${CPB_USER})"
echo ""
echo "Next steps:"
echo "  1. Run setup-db.sh to create the schema tables"
echo "  2. Remove POSTGRES_PASSWORD_MASTER from your environment"
