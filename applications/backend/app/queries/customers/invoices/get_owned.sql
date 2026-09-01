-- CUS.INVOICE.GET_OWNED — full invoice with items pre-aggregated.
SELECT i.invoice_id, i.invoice_number, i.subtotal, i.tax_amount,
       i.total_amount, i.currency, i.status, i.issued_at, i.paid_at,
       i.created_at,
       b.booking_number,
       p.display_name AS provider_name,
       COALESCE((
           SELECT json_agg(json_build_object(
                      'item_id', it.item_id, 'description', it.description,
                      'quantity', it.quantity, 'unit_amount', it.unit_amount,
                      'line_total', it.line_total) ORDER BY it.created_at)
             FROM "INVOICE_ITEMS" it
            WHERE it.invoice_id = i.invoice_id
       ), '[]'::json) AS items
  FROM "INVOICES" i
  JOIN "BOOKINGS" b  ON b.booking_id = i.booking_id
  JOIN "PROVIDERS" p ON p.provider_id = i.provider_id
 WHERE i.invoice_id = CAST(:invoice_id AS uuid)
   AND i.customer_id = CAST(:customer_id AS uuid);