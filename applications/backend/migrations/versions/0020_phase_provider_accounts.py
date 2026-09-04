"""phase provider accounts — provider identity, OTP, sessions (Provider Req Phases 1-2)

Revision ID: 0020_phase_provider_accounts
Revises: 0019_phase16_sp_qualify

Extends the marketplace "PROVIDERS" row into an authentication principal:
identity fields, credentials, account type, verification flags and status.
Adds provider-scoped OTP + session stores (parallel to the customer ones) so
the existing customer auth is untouched.

Table names are CAPITAL-quoted per project convention. Raw DDL only.
"""
from __future__ import annotations

from alembic import op

revision = "0020_phase_provider_accounts"
down_revision = "0019_phase16_sp_qualify"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---------------- PROVIDERS: identity + credentials ----------------------
    op.execute("ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS first_name VARCHAR(80)")
    op.execute("ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS middle_name VARCHAR(80)")
    op.execute("ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS last_name VARCHAR(80)")
    op.execute("ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS email VARCHAR(180)")
    op.execute("ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS phone VARCHAR(20)")
    op.execute("ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)")
    op.execute(
        "ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS account_type "
        "VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL'"
    )
    op.execute("ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS country VARCHAR(80)")
    op.execute("ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS district VARCHAR(80)")
    op.execute(
        "ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS preferred_language "
        "VARCHAR(10) NOT NULL DEFAULT 'en'"
    )
    op.execute("ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS referral_code VARCHAR(40)")
    op.execute(
        "ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS status "
        "VARCHAR(20) NOT NULL DEFAULT 'DRAFT'"
    )
    op.execute(
        "ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS email_verified "
        "BOOLEAN NOT NULL DEFAULT FALSE"
    )
    op.execute(
        "ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS phone_verified "
        "BOOLEAN NOT NULL DEFAULT FALSE"
    )
    op.execute(
        "ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS verification_status "
        "VARCHAR(24) NOT NULL DEFAULT 'NOT_SUBMITTED'"
    )
    op.execute("ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ")
    op.execute("ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ")
    op.execute(
        "ALTER TABLE \"PROVIDERS\" ADD COLUMN IF NOT EXISTS updated_at "
        "TIMESTAMPTZ NOT NULL DEFAULT now()"
    )
    op.execute('CREATE UNIQUE INDEX IF NOT EXISTS "IX_PROVIDERS_EMAIL" ON "PROVIDERS" (email)')
    op.execute('CREATE UNIQUE INDEX IF NOT EXISTS "IX_PROVIDERS_PHONE" ON "PROVIDERS" (phone)')
    op.execute('CREATE INDEX IF NOT EXISTS "IX_PROVIDERS_STATUS" ON "PROVIDERS" (status)')

    # ------------------------- PROVIDER OTP CODES ----------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_OTP_CODES" (
            otp_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id   UUID         NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
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
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_OTP_CODES_PROVIDER" '
        'ON "PROVIDER_OTP_CODES" (provider_id, purpose, consumed_at)'
    )

    # -------------------------- PROVIDER SESSIONS ---------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PROVIDER_AUTH_SESSIONS" (
            session_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider_id         UUID         NOT NULL REFERENCES "PROVIDERS"(provider_id) ON DELETE CASCADE,
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
        'CREATE INDEX IF NOT EXISTS "IX_PROVIDER_SESSIONS_PROVIDER" '
        'ON "PROVIDER_AUTH_SESSIONS" (provider_id, revoked_at)'
    )

    # -------------------- PROVIDER OTP FUNCTIONS (DB-side) --------------------
    op.execute(
        """
        CREATE OR REPLACE FUNCTION "SP_PROVIDER_ISSUE_OTP"(
            p_provider_id UUID,
            p_channel     VARCHAR,
            p_purpose     VARCHAR,
            p_code_hash   VARCHAR,
            p_ttl_minutes INT DEFAULT 10
        ) RETURNS UUID
        LANGUAGE plpgsql AS $$
        DECLARE
            v_otp_id UUID;
        BEGIN
            UPDATE "PROVIDER_OTP_CODES"
               SET consumed_at = now()
             WHERE provider_id = p_provider_id
               AND purpose     = p_purpose
               AND consumed_at IS NULL;

            INSERT INTO "PROVIDER_OTP_CODES" (provider_id, channel, purpose, code_hash, expires_at)
            VALUES (p_provider_id, p_channel, p_purpose, p_code_hash,
                    now() + make_interval(mins => p_ttl_minutes))
            RETURNING otp_id INTO v_otp_id;

            RETURN v_otp_id;
        END;
        $$
        """
    )
    op.execute(
        """
        CREATE OR REPLACE FUNCTION "SP_PROVIDER_VERIFY_OTP"(
            p_provider_id UUID,
            p_purpose     VARCHAR,
            p_code_hash   VARCHAR
        ) RETURNS BOOLEAN
        LANGUAGE plpgsql AS $$
        DECLARE
            v_otp "PROVIDER_OTP_CODES"%ROWTYPE;
        BEGIN
            SELECT * INTO v_otp
              FROM "PROVIDER_OTP_CODES"
             WHERE provider_id = p_provider_id
               AND purpose     = p_purpose
               AND consumed_at IS NULL
             ORDER BY created_at DESC
             LIMIT 1
             FOR UPDATE;

            IF NOT FOUND THEN
                RETURN FALSE;
            END IF;

            IF v_otp.expires_at < now() THEN
                UPDATE "PROVIDER_OTP_CODES" SET consumed_at = now() WHERE otp_id = v_otp.otp_id;
                RETURN FALSE;
            END IF;

            IF v_otp.code_hash <> p_code_hash THEN
                UPDATE "PROVIDER_OTP_CODES"
                   SET attempts = attempts + 1
                     , consumed_at = CASE WHEN attempts + 1 >= max_attempts THEN now() END
                 WHERE otp_id = v_otp.otp_id;
                RETURN FALSE;
            END IF;

            UPDATE "PROVIDER_OTP_CODES" SET consumed_at = now() WHERE otp_id = v_otp.otp_id;
            RETURN TRUE;
        END;
        $$
        """
    )


def downgrade() -> None:
    op.execute('DROP FUNCTION IF EXISTS "SP_PROVIDER_VERIFY_OTP"(UUID, VARCHAR, VARCHAR)')
    op.execute('DROP FUNCTION IF EXISTS "SP_PROVIDER_ISSUE_OTP"(UUID, VARCHAR, VARCHAR, VARCHAR, INT)')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_AUTH_SESSIONS"')
    op.execute('DROP TABLE IF EXISTS "PROVIDER_OTP_CODES"')
    op.execute(
        'ALTER TABLE "PROVIDERS" DROP COLUMN IF EXISTS updated_at, '
        'DROP COLUMN IF EXISTS privacy_accepted_at, DROP COLUMN IF EXISTS terms_accepted_at, '
        'DROP COLUMN IF EXISTS verification_status, DROP COLUMN IF EXISTS phone_verified, '
        'DROP COLUMN IF EXISTS email_verified, DROP COLUMN IF EXISTS status, '
        'DROP COLUMN IF EXISTS referral_code, DROP COLUMN IF EXISTS preferred_language, '
        'DROP COLUMN IF EXISTS district, DROP COLUMN IF EXISTS country, '
        'DROP COLUMN IF EXISTS account_type, DROP COLUMN IF EXISTS password_hash, '
        'DROP COLUMN IF EXISTS phone, DROP COLUMN IF EXISTS email, DROP COLUMN IF EXISTS last_name, '
        'DROP COLUMN IF EXISTS middle_name, DROP COLUMN IF EXISTS first_name'
    )