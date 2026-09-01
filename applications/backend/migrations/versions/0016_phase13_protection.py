"""Phase 13 - Customer Protection: cancellations, support, disputes.

Brings the BOOKINGS cancellation columns, five protection tables (all
CAPITAL-quoted), and an atomic SP_CANCEL_BOOKING that cancels the booking
and optionally credits the customer's wallet ledger in a single transaction.
"""
from __future__ import annotations

from alembic import op

revision = "0016_phase13_protection"
down_revision = "0015_phase12_functions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---- BOOKINGS: cancellation bookkeeping columns -------------------------
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ')
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS cancellation_fee NUMERIC(12,2)')
    op.execute('ALTER TABLE "BOOKINGS" ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12,2)')

    # ---- CANCELLATIONS (Module 37) -------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "CANCELLATIONS" (
            cancellation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            booking_id      UUID NOT NULL REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            customer_id     UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            fee_charged     NUMERIC(12,2) NOT NULL DEFAULT 0,
            refund_due      NUMERIC(12,2) NOT NULL DEFAULT 0,
            reason          TEXT NOT NULL,
            requested_by    VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_CANCEL_CUSTOMER" ON "CANCELLATIONS" (customer_id, created_at DESC)')
    op.execute('CREATE INDEX IF NOT EXISTS "IX_CANCEL_BOOKING" ON "CANCELLATIONS" (booking_id)')

    # ---- SUPPORT_TICKETS + TICKET_MESSAGES (Module 18) -----------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "SUPPORT_TICKETS" (
            ticket_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ticket_number VARCHAR(24) NOT NULL UNIQUE
                          DEFAULT 'SP-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text), 1, 4)),
            customer_id   UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            subject       VARCHAR(200) NOT NULL,
            category      VARCHAR(40) NOT NULL DEFAULT 'GENERAL',
            priority      VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
            status        VARCHAR(20) NOT NULL DEFAULT 'OPEN',
            resolution    TEXT,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "TICKET_MESSAGES" (
            message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ticket_id  UUID NOT NULL REFERENCES "SUPPORT_TICKETS"(ticket_id) ON DELETE CASCADE,
            sender     VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
            body       TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_TICKET_MSG" ON "TICKET_MESSAGES" (ticket_id, created_at)')
# ---- DISPUTES + DISPUTE_EVIDENCE (Module 39) -----------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "DISPUTES" (
            dispute_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            dispute_number VARCHAR(20) NOT NULL DEFAULT
                           'DP-' || to_char(now(), 'YYMMDDHH24M') || '-' || upper(substr(md5(random()::text), 1, 4)),
            booking_id     UUID NOT NULL REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            customer_id    UUID NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            category       VARCHAR(30) NOT NULL,
            description    TEXT NOT NULL,
            status         VARCHAR(30) NOT NULL DEFAULT 'OPEN',
            resolution     TEXT,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
            resolved_at    TIMESTAMPTZ
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_DISPUTE_CUSTOMER" ON "DISPUTES" (customer_id, created_at DESC)')
    op.execute('CREATE INDEX IF NOT EXISTS "IX_DISPUTE_BOOKING" ON "DISPUTES" (booking_id)')

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "DISPUTE_EVIDENCE" (
            evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            dispute_id  UUID NOT NULL REFERENCES "DISPUTES"(dispute_id) ON DELETE CASCADE,
            kind        VARCHAR(20) NOT NULL,
            url         TEXT NOT NULL,
            note        TEXT,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_DEVIDENCE_DISPUTE" ON "DISPUTE_EVIDENCE" (dispute_id)')

    # ---- Atomic cancel + optional wallet refund (Module 37) -------------------
    op.execute(
        """
        CREATE OR REPLACE FUNCTION SP_CANCEL_BOOKING(
            p_booking_id  UUID,
            p_customer_id UUID,
            p_reason      TEXT,
            p_fee         NUMERIC DEFAULT 0,
            p_refund      NUMERIC DEFAULT 0,
            p_requested   VARCHAR DEFAULT 'CUSTOMER'
        ) RETURNS TABLE(
            b_booking_id UUID,
            b_status     VARCHAR,
            b_refund     NUMERIC,
            ledger_id    UUID
        )
        LANGUAGE plpgsql AS $$
        DECLARE
            v_wallet UUID;
            v_ledger UUID;
        BEGIN
            UPDATE "BOOKINGS"
               SET status = 'CANCELLED',
                   cancelled_at = NOW(),
                   cancellation_fee = p_fee,
                   refund_amount = p_refund
             WHERE booking_id = p_booking_id
               AND customer_id = p_customer_id
               AND status IN ('CONFIRMED','PAYMENT_AUTHORIZED','ON_THE_WAY','ARRIVED',
                              'STARTED','IN_PROGRESS','COMPLETION_REQUESTED')
             RETURNING booking_id, status INTO b_booking_id, b_status;

            IF NOT FOUND THEN
                b_status := 'NOT_CANCELLABLE';
                RETURN QUERY SELECT p_booking_id, b_status, 0::NUMERIC, NULL::UUID;
                RETURN;
            END IF;

            INSERT INTO "CANCELLATIONS" (booking_id, customer_id, fee_charged, refund_due, reason, requested_by)
            VALUES (p_booking_id, p_customer_id, p_fee, p_refund, p_reason, p_requested);

            b_refund := p_refund;

            IF p_refund > 0 THEN
                SELECT wallet_id INTO v_wallet FROM "WALLETS" WHERE customer_id = p_customer_id;
                IF v_wallet IS NOT NULL THEN
                    INSERT INTO "WALLET_LEDGER"
                        (wallet_id, customer_id, entry_type, amount, running_balance, currency,
                         reference_type, reference_id, description)
                    VALUES
                        (v_wallet, p_customer_id, 'CREDIT', p_refund, 0, 'TZS',
                         'BOOKING_CANCELLATION', p_booking_id,
                         'Refund for cancelled booking')
                    RETURNING entry_id INTO v_ledger;

                    UPDATE "WALLETS"
                       SET balance = balance + p_refund, updated_at = NOW()
                     WHERE wallet_id = v_wallet;
                END IF;
            END IF;

            RETURN QUERY SELECT p_booking_id, b_status, b_refund, v_ledger;
        END;
        $$;
        """
    )


def downgrade() -> None:
    op.execute('DROP FUNCTION IF EXISTS SP_CANCEL_BOOKING(UUID, UUID, TEXT, NUMERIC, NUMERIC, VARCHAR)')
    op.execute('DROP TABLE IF EXISTS "DISPUTE_EVIDENCE"')
    op.execute('DROP TABLE IF EXISTS "DISPUTES"')
    op.execute('DROP TABLE IF EXISTS "TICKET_MESSAGES"')
    op.execute('DROP TABLE IF EXISTS "SUPPORT_TICKETS"')
    op.execute('DROP TABLE IF EXISTS "CANCELLATIONS"')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS refund_amount')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS cancellation_fee')
    op.execute('ALTER TABLE "BOOKINGS" DROP COLUMN IF EXISTS cancelled_at')