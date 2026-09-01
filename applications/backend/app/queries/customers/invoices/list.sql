-- CUS.INVOICE.LIST — customer invoices, newest first.
SELECT i.invoice_id, i.invoice_number, i.total_amount, i.currency,
       i.status, i.issued_at, i.paid_at, i.created_at,
       b.booking_number
  FROM "INVOICES" i
  JOIN "BOOKINGS" b ON b.booking_id = i.booking_id
 WHERE i.customer_id = CAST(:customer_id AS uuid)
 ORDER BY i.created_at DESC
 LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);