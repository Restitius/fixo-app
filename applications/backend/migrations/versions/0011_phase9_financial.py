"""phase9 financial completion — invoices, items, payment capture.

Revision ID: 0011_phase9_financial
Revises: 0010_phase8_execution
"""
from __future__ import annotations

from alembic import op

revision = "0011_phase9_financial"
down_revision = "0010_phase8_execution"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------- INVOICES --------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "INVOICES" (
            invoice_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_number VARCHAR(24) NOT NULL UNIQUE,
            booking_id     UUID        NOT NULL UNIQUE REFERENCES "BOOKINGS"(booking_id) ON DELETE CASCADE,
            customer_id    UUID        NOT NULL REFERENCES "CUSTOMERS"(customer_id) ON DELETE CASCADE,
            provider_id    UUID        NOT NULL REFERENCES "PROVIDERS"(provider_id),
            subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
            tax_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
            total_amount   NUMERIC(10,2) NOT NULL,
            currency       VARCHAR(3)  NOT NULL DEFAULT 'TZS',
            status         VARCHAR(12) NOT NULL DEFAULT 'DRAFT',
            issued_at      TIMESTAMPTZ,
            paid_at        TIMESTAMPTZ,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('ALTER TABLE "INVOICES" DROP CONSTRAINT IF EXISTS "CK_INVOICE_STATUS"')
    op.execute(
        'ALTER TABLE "INVOICES" ADD CONSTRAINT "CK_INVOICE_STATUS" '
        "CHECK (status IN ('DRAFT','ISSUED','PAID','VOID'))"
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_INVOICE_CUSTOMER" ON "INVOICES" (customer_id, status)')

    # ------------------------------ INVOICE ITEMS -----------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS "INVOICE_ITEMS" (
            item_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_id  UUID         NOT NULL REFERENCES "INVOICES"(invoice_id) ON DELETE CASCADE,
            description VARCHAR(255) NOT NULL,
            quantity    SMALLINT     NOT NULL DEFAULT 1,
            unit_amount NUMERIC(10,2) NOT NULL,
            line_total  NUMERIC(10,2) NOT NULL,
            created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "IX_INVOICE_ITEMS" ON "INVOICE_ITEMS" (invoice_id)')

    # ------------------------ SP_FINALIZE_INVOICE (Phase 9) ---------------------
    op.execute(
        """
        CREATE OR REPLACE FUNCTION "SP_FINALIZE_INVOICE"(
            p_customer_id uuid,
            p_booking_id  uuid,
            p_tax_rate    numeric DEFAULT 0.18
        )
        RETURNS TABLE (
            invoice_id     uuid,
            invoice_number varchar,
            subtotal       numeric,
            tax_amount     numeric,
            total_amount   numeric,
            currency       varchar,
            status         varchar
        )
        LANGUAGE plpgsql AS $$
        #variable_conflict use_column
        DECLARE
            v_booking record;
        BEGIN
            SELECT b.booking_id, b.customer_id, b.provider_id,
                   b.agreed_amount, b.currency, b.booking_number
              INTO v_booking
              FROM "BOOKINGS" b
             WHERE b.booking_id = p_booking_id
               AND b.customer_id = p_customer_id;

            IF v_booking.booking_id IS NULL THEN
                RETURN;
            END IF;

            INSERT INTO "INVOICES" (
                booking_id, customer_id, provider_id,
                subtotal, tax_amount, total_amount, currency, status,
                invoice_number
            )
            VALUES (
                v_booking.booking_id, v_booking.customer_id, v_booking.provider_id,
                v_booking.agreed_amount,
                round(v_booking.agreed_amount * p_tax_rate, 2),
                round(v_booking.agreed_amount * (1 + p_tax_rate), 2),
                v_booking.currency, 'DRAFT',
                'INV-' || to_char(now(), 'YYMMDDHH24MI') || '-'
                    || upper(substr(md5(random()::text), 1, 4))
            )
            RETURNING invoice_id, invoice_number INTO invoice_id, invoice_number;

            INSERT INTO "INVOICE_ITEMS" (invoice_id, description, quantity, unit_amount, line_total)
            VALUES
                (invoice_id, 'Professional service — ' || v_booking.booking_number, 1,
                 v_booking.agreed_amount, v_booking.agreed_amount),
                (invoice_id, 'VAT (' || round(p_tax_rate * 100)::int || '%)', 1,
                 round(v_booking.agreed_amount * p_tax_rate, 2),
                 round(v_booking.agreed_amount * p_tax_rate, 2));

            RETURN QUERY
            SELECT i.invoice_id, i.invoice_number, i.subtotal,
                   i.tax_amount, i.total_amount, i.currency, i.status
              FROM "INVOICES" i
             WHERE i.invoice_id = invoice_id;
        END;
        $$;
        """
    )

    # Payment capture reference on the payment attempt.
    op.execute('ALTER TABLE "PAYMENTS" ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ')
    op.execute('CREATE INDEX IF NOT EXISTS "IX_PAYMENT_MOST_RECENT" ON "PAYMENTS" (booking_id, attempt_no DESC)')

    # ------------------- Workflow states for Phase 9 --------------------------
    op.execute('ALTER TABLE "BOOKINGS" DROP CONSTRAINT IF EXISTS "CK_BOOKING_STATUS"')
    op.execute(
        'ALTER TABLE "BOOKINGS" ADD CONSTRAINT "CK_BOOKING_STATUS" '
        "CHECK (status IN ('CONFIRMED','PAYMENT_AUTHORIZED','ON_THE_WAY','ARRIVED',"
        "'STARTED','IN_PROGRESS','COMPLETION_REQUESTED','CUSTOMER_CONFIRMED',"
        "'PAID','CLOSED','PAYMENT_FAILED','CANCELLED'))"
    )


def downgrade() -> None:
    op.execute('DROP INDEX IF EXISTS "IX_PAYMENT_MOST_RECENT"')
    op.execute('ALTER TABLE "PAYMENTS" DROP COLUMN IF EXISTS captured_at')
    op.execute('DROP TABLE IF EXISTS "INVOICE_ITEMS"')
    op.execute('DROP TABLE IF EXISTS "INVOICES"')