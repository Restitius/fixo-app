"""Phase 15 - Account Management: payment methods, preferences, security, privacy, account closure."""
from __future__ import annotations
from alembic import op

revision = "0017_phase15_account"
down_revision = "0016_phase13_protection"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---- PAYMENT_METHODS (Module 45) --------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "PAYMENT_METHODS" (
            method_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id    UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            type           VARCHAR(20) NOT NULL CHECK (type IN ('card','mpesa','bank')),
            provider       VARCHAR(40),
            details_masked JSONB NOT NULL,
            is_default     BOOLEAN NOT NULL DEFAULT FALSE,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_PAYMENT_CUSTOMER" ON "PAYMENT_METHODS" (customer_id)')
    op.execute('CREATE INDEX IF NOT EXISTS "IX_PAYMENT_DEFAULT" ON "PAYMENT_METHODS" (customer_id, is_default) WHERE is_default')
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS \"UX_PAYMENT_SINGLE_DEFAULT\" "
        "ON \"PAYMENT_METHODS\" (customer_id) WHERE is_default"
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "CUSTOMER_PREFERENCES" (
            preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id   UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            key           VARCHAR(80) NOT NULL,
            value         TEXT NOT NULL,
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (customer_id, key)
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_PREFS_CUSTOMER" ON "CUSTOMER_PREFERENCES" (customer_id)')
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "CONSENTS" (
            consent_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id  UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            kind         VARCHAR(40) NOT NULL,
            consented    BOOLEAN NOT NULL DEFAULT TRUE,
            revoked_at   TIMESTAMPTZ,
            consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (customer_id, kind)
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_CONSENTS_CUSTOMER" ON "CONSENTS" (customer_id)')
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "SESSION_REVOCATIONS" (
            revocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id   UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            reason        VARCHAR(100) NOT NULL,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_REVOCATIONS_CUSTOMER" ON "SESSION_REVOCATIONS" (customer_id, created_at DESC)')
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "ACCOUNT_CLOSURES" (
            closure_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id    UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            reason         TEXT NOT NULL,
            scheduled_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            executed_at    TIMESTAMPTZ,
            reversed_at    TIMESTAMPTZ,
            is_reversal    BOOLEAN NOT NULL DEFAULT FALSE,
            UNIQUE (customer_id, scheduled_at, is_reversal)
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_CLOSURES_CUSTOMER" ON "ACCOUNT_CLOSURES" (customer_id)')
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "DATA_EXPORT_REQUESTS" (
            request_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id    UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            status         VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','READY','FAILED')),
            requested_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            completed_at   TIMESTAMPTZ,
            file_path      TEXT
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_EXPORTS_CUSTOMER" ON "DATA_EXPORT_REQUESTS" (customer_id, requested_at DESC)')
    op.execute(
        """
        CREATE OR REPLACE FUNCTION SP_DELETE_ACCOUNT(p_customer_id UUID)
        RETURNS TABLE(closed BOOLEAN, reversible BOOLEAN)
        LANGUAGE plpgsql AS $$
        BEGIN
            INSERT INTO "ACCOUNT_CLOSURES" (customer_id, reason, scheduled_at)
            VALUES (p_customer_id, 'customer_requested', now());
            UPDATE "CUSTOMERS"
               SET deleted_at = now(), is_deleted = TRUE
             WHERE customer_id = p_customer_id;
            RETURN QUERY SELECT TRUE, TRUE;
        END;
        $$;
        """
    )
    op.execute(
        """
        CREATE OR REPLACE FUNCTION SP_REQUEST_DATA_EXPORT(p_customer_id UUID)
        RETURNS TABLE(request_id UUID, status VARCHAR)
        LANGUAGE plpgsql AS $$
        DECLARE v_rid UUID;
        BEGIN
            INSERT INTO "DATA_EXPORT_REQUESTS" (customer_id)
            VALUES (p_customer_id)
            RETURNING request_id INTO v_rid;
            RETURN QUERY SELECT v_rid, 'PENDING'::VARCHAR;
        END;
        $$;
        """
    )


def downgrade() -> None:
    op.execute('DROP FUNCTION IF EXISTS SP_REQUEST_DATA_EXPORT(UUID)')
    op.execute('DROP FUNCTION IF EXISTS SP_DELETE_ACCOUNT(UUID)')
    op.execute('DROP TABLE IF EXISTS "DATA_EXPORT_REQUESTS"')
    op.execute('DROP TABLE IF EXISTS "ACCOUNT_CLOSURES"')
    op.execute('DROP TABLE IF EXISTS "SESSION_REVOCATIONS"')
    op.execute('DROP TABLE IF EXISTS "CONSENTS"')
    op.execute('DROP TABLE IF EXISTS "CUSTOMER_PREFERENCES"')
    op.execute('DROP TABLE IF EXISTS "PAYMENT_METHODS"')