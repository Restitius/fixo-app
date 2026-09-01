-- CUS.INVOICE.LIST — customer invoices, newest first.
SELECT i.invoice_id, i.invoice_number, i.total_amount, i.currency,
       i.status, i.issued_at, i.paid_at, i.created_at,
       b.booking_number, p.display_name AS provider_name, s.name AS service_name
  FROM "INVOICES" i
  JOIN "BOOKINGS" b   ON b.booking_id = i.booking_id
  JOIN "PROVIDERS" p  ON p.provider_id = i.provider_id
  LEFT JOIN "SERVICES" s ON s.service_id = b.service_id
 WHERE i.customer_id = CAST(:customer_id AS uuid)
 ORDER BY i.created_at DESC
 LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);