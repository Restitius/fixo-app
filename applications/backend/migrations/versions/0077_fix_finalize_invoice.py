"""SP_FINALIZE_INVOICE returned every invoice in the system.

The function ended with ``WHERE i.invoice_id = invoice_id`` while running under
``#variable_conflict use_column``: both sides resolved to the table column, so the
predicate was always true and the caller (which takes the first row) received an
arbitrary - usually another customer's - invoice instead of the one just created.

The function now keeps the new id in an unambiguous variable, is idempotent per
booking (returns the existing invoice rather than creating a duplicate) and uses a
longer random suffix for the invoice number.
"""

from alembic import op

revision = "0077"
down_revision = "0076"


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION "SP_FINALIZE_INVOICE"(
            p_customer_id uuid, p_booking_id uuid, p_tax_rate numeric DEFAULT 0.18
        ) RETURNS TABLE(invoice_id uuid, invoice_number character varying,
                        subtotal numeric, tax_amount numeric, total_amount numeric,
                        currency character varying, status character varying)
        LANGUAGE plpgsql AS $$
        #variable_conflict use_column
        DECLARE
            v_booking record;
            v_invoice_id uuid;
        BEGIN
            SELECT b.booking_id, b.customer_id, b.provider_id,
                   b.agreed_amount, b.currency, b.booking_number
              INTO v_booking
              FROM "BOOKINGS" b
             WHERE b.booking_id = p_booking_id
               AND b.customer_id = p_customer_id;

            IF v_booking.booking_id IS NULL THEN
                RETURN;   -- not owned / not found
            END IF;

            SELECT i.invoice_id INTO v_invoice_id
              FROM "INVOICES" i
             WHERE i.booking_id = p_booking_id AND i.customer_id = p_customer_id
             ORDER BY i.created_at DESC
             LIMIT 1;

            IF v_invoice_id IS NULL THEN
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
                        || upper(substr(md5(random()::text), 1, 6))
                )
                RETURNING "INVOICES".invoice_id INTO v_invoice_id;

                INSERT INTO "INVOICE_ITEMS" (invoice_id, description, quantity, unit_amount, line_total)
                VALUES
                    (v_invoice_id, 'Professional service - ' || v_booking.booking_number, 1,
                     v_booking.agreed_amount, v_booking.agreed_amount),
                    (v_invoice_id, 'VAT (' || round(p_tax_rate * 100)::int || '%)', 1,
                     round(v_booking.agreed_amount * p_tax_rate, 2),
                     round(v_booking.agreed_amount * p_tax_rate, 2));
            END IF;

            RETURN QUERY
            SELECT i.invoice_id, i.invoice_number, i.subtotal,
                   i.tax_amount, i.total_amount, i.currency, i.status
              FROM "INVOICES" i
             WHERE i.invoice_id = v_invoice_id;
        END;
        $$;
        """
    )


def downgrade() -> None:
    # The previous definition leaked other customers' invoices; do not restore it.
    pass
