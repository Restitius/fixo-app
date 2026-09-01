-- CUS.INVOICE.GET_OWNED — full invoice with items pre-aggregated.
SELECT i.invoice_id, i.invoice_number, i.subtotal, i.tax_amount,
       i.total_amount, i.currency, i.status, i.issued_at, i.paid_at,
       i.created_at,
       b.booking_number, b.scheduled_date,
       p.display_name AS provider_name,
       s.name AS service_name,
       c.name AS category_name,
       a.city AS address_city, a.region AS address_region,
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
  LEFT JOIN "SERVICES" s ON s.service_id = b.service_id
  LEFT JOIN "SERVICE_CATEGORIES" c ON c.category_id = s.category_id
  LEFT JOIN "CUSTOMER_ADDRESSES" a ON a.address_id = b.address_id
 WHERE i.invoice_id = CAST(:invoice_id AS uuid)
   AND i.customer_id = CAST(:customer_id AS uuid);