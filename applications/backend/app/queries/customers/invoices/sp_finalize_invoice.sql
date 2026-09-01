-- SP_FINALIZE_INVOICE — create + itemize + tax in ONE sequential function.
-- Snapshot of the agreed amount plus a standard 18% VAT item.
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
        RETURN;   -- not owned / not found
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