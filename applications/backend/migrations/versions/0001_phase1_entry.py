"""phase1 platform entry — customers, otp, sessions, onboarding, public content

Revision ID: 0001_phase1_entry
Revises:
Create Date: 2026-08-24

Table names are CAPITAL-quoted per project convention (Postgres preserves case
only for quoted identifiers). Raw DDL only — no ORM models.
"""
from __future__ import annotations

from alembic import op

revision = "0001_phase1_entry"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    # ----------------------------- CUSTOMERS --------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "CUSTOMERS" (
            customer_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name        VARCHAR(120)  NOT NULL,
            phone            VARCHAR(20)   NOT NULL,
            email            VARCHAR(180)  NOT NULL,
            password_hash    VARCHAR(255)  NOT NULL,
            preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
            status           VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
            email_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
            phone_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
            terms_accepted_at     TIMESTAMPTZ,
            privacy_accepted_at   TIMESTAMPTZ,
            social_provider  VARCHAR(30),
            social_subject   VARCHAR(255),
            created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
            updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_CUSTOMERS_EMAIL" UNIQUE (email),
            CONSTRAINT "UQ_CUSTOMERS_PHONE" UNIQUE (phone)
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_CUSTOMERS_STATUS" ON "CUSTOMERS" (status)'
    )

    # ----------------------------- OTP CODES --------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "OTP_CODES" (
            otp_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id   UUID         NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            channel       VARCHAR(10)  NOT NULL,
            purpose       VARCHAR(30)  NOT NULL,
            code_hash     VARCHAR(255) NOT NULL,
            attempts      SMALLINT     NOT NULL DEFAULT 0,
            max_attempts  SMALLINT     NOT NULL DEFAULT 5,
            expires_at    TIMESTAMPTZ  NOT NULL,
            consumed_at   TIMESTAMPTZ,
            created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_OTP_CODES_CUSTOMER" '
        'ON "OTP_CODES" (customer_id, purpose, consumed_at)'
    )

    # --------------------------- AUTH SESSIONS ------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "AUTH_SESSIONS" (
            session_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id         UUID         NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            refresh_token_hash  VARCHAR(255) NOT NULL,
            device_info         VARCHAR(255),
            ip_address          VARCHAR(45),
            expires_at          TIMESTAMPTZ  NOT NULL,
            revoked_at          TIMESTAMPTZ,
            created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS "IX_AUTH_SESSIONS_CUSTOMER" '
        'ON "AUTH_SESSIONS" (customer_id, revoked_at)'
    )

    # ------------------------- ONBOARDING STEPS -----------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "ONBOARDING_STEPS" (
            step_id     SERIAL PRIMARY KEY,
            code        VARCHAR(40)  NOT NULL UNIQUE,
            title       VARCHAR(120) NOT NULL,
            description VARCHAR(500),
            sort_order  SMALLINT     NOT NULL,
            is_required BOOLEAN      NOT NULL DEFAULT TRUE
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "CUSTOMER_ONBOARDING_PROGRESS" (
            customer_id  UUID        NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            step_id      INTEGER     NOT NULL REFERENCES "ONBOARDING_STEPS"(step_id),
            completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (customer_id, step_id)
        )
        """
    )
    op.execute(
        """
        INSERT INTO "ONBOARDING_STEPS" (code, title, description, sort_order, is_required) VALUES
            ('VERIFY_CONTACT', 'Verify contact',    'Confirm your phone number or email via the code we sent.', 1, TRUE),
            ('SET_LOCATION',   'Set your location', 'Tell us where you live so we can find nearby providers.',  2, TRUE),
            ('ADD_PROPERTY',   'Add a property',    'Register the home or property services will be done at.',  3, FALSE)
        ON CONFLICT (code) DO NOTHING
        """
    )

    # ------------------------ SERVICE CATALOG (public slice) ----------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "SERVICE_CATEGORIES" (
            category_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code         VARCHAR(40)  NOT NULL UNIQUE,
            name         VARCHAR(120) NOT NULL,
            description  VARCHAR(500),
            icon         VARCHAR(60),
            sort_order   SMALLINT     NOT NULL DEFAULT 0,
            is_active    BOOLEAN      NOT NULL DEFAULT TRUE
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "SERVICES" (
            service_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            category_id  UUID         NOT NULL REFERENCES "SERVICE_CATEGORIES"(category_id),
            name         VARCHAR(160) NOT NULL,
            slug         VARCHAR(160) NOT NULL UNIQUE,
            description  VARCHAR(1000),
            is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
            created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_SERVICES_CATEGORY" ON "SERVICES" (category_id)')
    op.execute(
        """
        INSERT INTO "SERVICE_CATEGORIES" (code, name, description, icon, sort_order) VALUES
            ('PLUMBING',    'Plumbing',             'Leaks, pipes, taps, water heaters.',       'wrench',      1),
            ('ELECTRICAL',  'Electrical Services',  'Wiring, sockets, lighting, faults.',       'zap',         2),
            ('CLEANING',    'Cleaning',             'Home and office cleaning services.',       'sparkles',    3),
            ('CARPENTRY',   'Carpentry',            'Furniture, doors, cabinets, repairs.',     'hammer',      4),
            ('PAINTING',    'Painting',             'Interior and exterior painting.',          'paintbrush',  5),
            ('APPLIANCE',   'Appliance Repair',     'Fridges, cookers, washers, microwaves.',   'tv',          6),
            ('AC',          'Air-Conditioning',     'AC install, service and repair.',          'wind',        7),
            ('GARDENING',   'Gardening',            'Lawns, hedges, plants and trees.',         'leaf',        8),
            ('PEST',        'Pest Control',         'Safe treatment of pests and insects.',     'bug',         9),
            ('MOVING',      'Moving Assistance',    'Help with packing and moving homes.',      'truck',      10),
            ('MAINTENANCE', 'General Maintenance',  'Odd jobs and general handyman work.',      'tool',       11),
            ('EMERGENCY',   'Emergency Services',   'Urgent help, fastest provider matching.',  'siren',      12)
        ON CONFLICT (code) DO NOTHING
        """
    )

    # ------------------------------ FAQS ------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "FAQS" (
            faq_id     SERIAL PRIMARY KEY,
            question   VARCHAR(300) NOT NULL,
            answer     TEXT         NOT NULL,
            sort_order SMALLINT     NOT NULL DEFAULT 0,
            is_public  BOOLEAN      NOT NULL DEFAULT TRUE
        )
        """
    )
    op.execute(
        """
        INSERT INTO "FAQS" (question, answer, sort_order) VALUES
            ('How do I request a service?', 'Describe your problem, pick a category, and submit. Providers send quotes fast.', 1),
            ('Are providers verified?',     'Yes - identity, skills and reviews are checked before anyone is listed.', 2),
            ('When do I pay?',              'Payment is authorized when you confirm a booking and captured only after you approve the work.', 3),
            ('What if something goes wrong?','Every booking includes support and a formal dispute process with evidence upload.', 4)
        """
    )

    # -------------------------- CONTENT BLOCKS ------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "CONTENT_BLOCKS" (
            block_code  VARCHAR(60) PRIMARY KEY,
            title       VARCHAR(200) NOT NULL,
            body        TEXT         NOT NULL,
            sort_order  SMALLINT     NOT NULL DEFAULT 0,
            is_public   BOOLEAN      NOT NULL DEFAULT TRUE,
            updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        INSERT INTO "CONTENT_BLOCKS" (block_code, title, body, sort_order) VALUES
            ('HERO',         'Trusted help for your home',
             'Book verified handyman professionals in minutes - plumbing, electrical, cleaning and more.', 1),
            ('HOW_IT_WORKS', 'How it works',
             'Describe your problem, receive quotes from verified providers, pick your favourite, and track the job live.', 2),
            ('SAFETY',       'Safety first',
             'Every provider passes identity checks, skill screening and continuous rating reviews before they reach your door.', 3),
            ('CONTACT',      'Contact us',
             'Email support@handyman.app or call +000-000-0000. We answer every message within one business day.', 4)
        ON CONFLICT (block_code) DO NOTHING
        """
    )

    # --------------------- OTP FUNCTIONS (DB-side logic) --------------------
    op.execute(
        """
        CREATE OR REPLACE FUNCTION "SP_ISSUE_OTP"(
            p_customer_id  UUID,
            p_channel      VARCHAR,
            p_purpose      VARCHAR,
            p_code_hash    VARCHAR,
            p_ttl_minutes  INT DEFAULT 10
        ) RETURNS UUID
        LANGUAGE plpgsql AS $$
        DECLARE
            v_otp_id UUID;
        BEGIN
            UPDATE "OTP_CODES"
               SET consumed_at = now()
             WHERE customer_id = p_customer_id
               AND purpose     = p_purpose
               AND consumed_at IS NULL;

            INSERT INTO "OTP_CODES" (customer_id, channel, purpose, code_hash, expires_at)
            VALUES (p_customer_id, p_channel, p_purpose, p_code_hash,
                    now() + make_interval(mins => p_ttl_minutes))
            RETURNING otp_id INTO v_otp_id;

            RETURN v_otp_id;
        END;
        $$
        """
    )
    op.execute(
        """
        CREATE OR REPLACE FUNCTION "SP_VERIFY_OTP"(
            p_customer_id UUID,
            p_purpose     VARCHAR,
            p_code_hash   VARCHAR
        ) RETURNS BOOLEAN
        LANGUAGE plpgsql AS $$
        DECLARE
            v_otp "OTP_CODES"%ROWTYPE;
        BEGIN
            SELECT * INTO v_otp
              FROM "OTP_CODES"
             WHERE customer_id = p_customer_id
               AND purpose     = p_purpose
               AND consumed_at IS NULL
             ORDER BY created_at DESC
             LIMIT 1
             FOR UPDATE;

            IF NOT FOUND THEN
                RETURN FALSE;
            END IF;

            IF v_otp.expires_at < now() THEN
                UPDATE "OTP_CODES" SET consumed_at = now() WHERE otp_id = v_otp.otp_id;
                RETURN FALSE;
            END IF;

            IF v_otp.code_hash <> p_code_hash THEN
                UPDATE "OTP_CODES"
                   SET attempts = attempts + 1
                     , consumed_at = CASE WHEN attempts + 1 >= max_attempts THEN now() END
                 WHERE otp_id = v_otp.otp_id;
                RETURN FALSE;
            END IF;

            UPDATE "OTP_CODES" SET consumed_at = now() WHERE otp_id = v_otp.otp_id;
            RETURN TRUE;
        END;
        $$
        """
    )


def downgrade() -> None:
    for stmt in (
        'DROP FUNCTION IF EXISTS "SP_VERIFY_OTP"(UUID, VARCHAR, VARCHAR)',
        'DROP FUNCTION IF EXISTS "SP_ISSUE_OTP"(UUID, VARCHAR, VARCHAR, VARCHAR, INT)',
        'DROP TABLE IF EXISTS "CONTENT_BLOCKS"',
        'DROP TABLE IF EXISTS "FAQS"',
        'DROP TABLE IF EXISTS "SERVICES"',
        'DROP TABLE IF EXISTS "SERVICE_CATEGORIES"',
        'DROP TABLE IF EXISTS "CUSTOMER_ONBOARDING_PROGRESS"',
        'DROP TABLE IF EXISTS "ONBOARDING_STEPS"',
        'DROP TABLE IF EXISTS "AUTH_SESSIONS"',
        'DROP TABLE IF EXISTS "OTP_CODES"',
        'DROP TABLE IF EXISTS "CUSTOMERS"',
    ):
        op.execute(stmt)



