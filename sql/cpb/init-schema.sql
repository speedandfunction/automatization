-- =============================================================================
-- CPB (Connecting People Bot) - Database Schema
-- =============================================================================
-- Database:    cpb_bot
-- Engine:      PostgreSQL 14+
-- Purpose:     Complete schema for the CPB Slack bot that randomly pairs
--              employees for monthly virtual coffee 1-on-1 meetings.
--
-- Usage:       psql -h <host> -U cpb_app -d cpb_bot -f init-schema.sql
--
-- Notes:
--   - All CREATE TABLE / CREATE INDEX use IF NOT EXISTS for idempotent re-runs
--   - No transaction wrapper (each statement runs independently)
--   - Status/response columns use VARCHAR + CHECK constraints
--   - Trigger function auto-updates updated_at on mutable tables
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Trigger function: auto-update updated_at on row modification
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------------
-- Table: cycles
-- One row per monthly cycle. Central entity that all other tables reference.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cycles (
    id                SERIAL PRIMARY KEY,
    year_month        VARCHAR(7)    NOT NULL UNIQUE         -- e.g. '2026-03'
                      CHECK (year_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    opt_in_send_at    TIMESTAMPTZ   NOT NULL,
    pairing_send_at   TIMESTAMPTZ   NOT NULL,
    checkin_send_at   TIMESTAMPTZ   NOT NULL,
    survey_send_at    TIMESTAMPTZ   NOT NULL,
    status            VARCHAR(20)   NOT NULL DEFAULT 'pending'
                      CHECK (status IN (
                          'pending',
                          'opt_in_sent',
                          'paired',
                          'checkin_sent',
                          'survey_sent',
                          'completed'
                      )),
    eligible_count    INTEGER,
    opted_in_count    INTEGER,
    paired_count      INTEGER,
    unpaired_count    INTEGER,
    avg_pair_weight   NUMERIC(5,3),                        -- time-decay algorithm quality metric
    repeat_pair_count INTEGER,                             -- how many pairs are repeats this cycle
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_cycles_updated_at ON cycles;
CREATE TRIGGER trg_cycles_updated_at
    BEFORE UPDATE ON cycles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- Table: opt_in_responses
-- One row per person per cycle. UPSERT on (cycle_id, slack_user_id) = last click wins.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opt_in_responses (
    id                SERIAL PRIMARY KEY,
    cycle_id          INTEGER       NOT NULL REFERENCES cycles(id),
    slack_user_id     VARCHAR(20)   NOT NULL,
    slack_display_name VARCHAR(200),
    message_ts        VARCHAR(30),                         -- for chat.update
    channel_id        VARCHAR(20),                         -- DM channel
    response          VARCHAR(20)
                      CHECK (response IN (
                          'definitely_yes',
                          'dont_mind',
                          'skip'
                      )),                                  -- NULL = no response yet
    responded_at      TIMESTAMPTZ,
    message_sent_at   TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (cycle_id, slack_user_id)
);

DROP TRIGGER IF EXISTS trg_opt_in_responses_updated_at ON opt_in_responses;
CREATE TRIGGER trg_opt_in_responses_updated_at
    BEFORE UPDATE ON opt_in_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- Table: pairings
-- One row per pair per cycle. Canonical ordering enforced: person_a_id < person_b_id.
-- Same pair may recur across cycles (repeats tracked via is_repeat flag).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pairings (
    id                  SERIAL PRIMARY KEY,
    cycle_id            INTEGER       NOT NULL REFERENCES cycles(id),
    person_a_id         VARCHAR(20)   NOT NULL,            -- always lexicographically smaller
    person_b_id         VARCHAR(20)   NOT NULL,            -- always lexicographically larger
    scheduler_id        VARCHAR(20)   NOT NULL,
    is_repeat           BOOLEAN       NOT NULL DEFAULT false,
    pair_weight         NUMERIC(5,3),                      -- algorithm weight at time of pairing
    person_a_notified_at TIMESTAMPTZ,
    person_b_notified_at TIMESTAMPTZ,
    person_a_msg_ts     VARCHAR(30),
    person_b_msg_ts     VARCHAR(30),
    person_a_dm_channel VARCHAR(20),
    person_b_dm_channel VARCHAR(20),
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CHECK (person_a_id < person_b_id),                     -- ordering invariant
    UNIQUE (cycle_id, person_a_id, person_b_id)            -- one pair per cycle
);

CREATE INDEX IF NOT EXISTS idx_pairings_pair
    ON pairings(person_a_id, person_b_id);

DROP TRIGGER IF EXISTS trg_pairings_updated_at ON pairings;
CREATE TRIGGER trg_pairings_updated_at
    BEFORE UPDATE ON pairings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ---------------------------------------------------------------------------
-- Table: pair_history
-- Materialized summary for the pairing algorithm. Updated via UPSERT after each cycle.
-- Rebuildable from pairings table if corrupted.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pair_history (
    person_a_id       VARCHAR(20)   NOT NULL,
    person_b_id       VARCHAR(20)   NOT NULL,
    pair_count        INTEGER       NOT NULL DEFAULT 0,
    last_cycle_id     INTEGER       NOT NULL REFERENCES cycles(id),
    last_paired_at    TIMESTAMPTZ   NOT NULL,
    first_paired_at   TIMESTAMPTZ   NOT NULL,
    PRIMARY KEY (person_a_id, person_b_id),
    CHECK (person_a_id < person_b_id)                      -- ordering invariant
);

CREATE INDEX IF NOT EXISTS idx_pair_history_last_cycle
    ON pair_history(last_cycle_id);


-- ---------------------------------------------------------------------------
-- Table: interactions
-- Append-only audit log. Every button click = new row. Never updated or deleted.
-- Resolved state (last click) derived via DISTINCT ON queries.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interactions (
    id                SERIAL PRIMARY KEY,
    cycle_id          INTEGER       NOT NULL REFERENCES cycles(id),
    slack_user_id     VARCHAR(20)   NOT NULL,
    pairing_id        INTEGER       REFERENCES pairings(id),  -- NULL for opt-in (no pairing yet)
    touchpoint        VARCHAR(20)   NOT NULL,
    action            VARCHAR(30)   NOT NULL,
    CONSTRAINT interactions_touchpoint_action_valid CHECK (
        (touchpoint = 'opt_in'   AND action IN ('definitely_yes', 'dont_mind', 'skip'))
     OR (touchpoint = 'checkin'  AND action IN ('checkin_yes', 'checkin_no'))
     OR (touchpoint = 'survey'   AND action IN ('satisfied', 'unsatisfied', 'didnt_happen'))
    ),
    raw_payload       JSONB,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_cycle_user
    ON interactions(cycle_id, slack_user_id);

CREATE INDEX IF NOT EXISTS idx_interactions_cycle_touchpoint
    ON interactions(cycle_id, touchpoint);

CREATE INDEX IF NOT EXISTS idx_interactions_pairing
    ON interactions(pairing_id);


-- ---------------------------------------------------------------------------
-- Table: admin_reports
-- One report per cycle. Tracks generation and delivery to Slack admin channel.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_reports (
    id                SERIAL PRIMARY KEY,
    cycle_id          INTEGER       NOT NULL UNIQUE REFERENCES cycles(id),
    report_data       JSONB         NOT NULL,
    sent_to_slack     BOOLEAN       NOT NULL DEFAULT false,
    slack_channel_id  VARCHAR(20),
    slack_message_ts  VARCHAR(30),
    sent_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_admin_reports_updated_at ON admin_reports;
CREATE TRIGGER trg_admin_reports_updated_at
    BEFORE UPDATE ON admin_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
