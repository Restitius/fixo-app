-- CUS.INVOICE.GET_BY_BOOKING — latest invoice of one owned booking.
SELECT i.invoice_id, i.invoice_number, i.total_amount, i.currency,
       i.status, i.issued_at, i.paid_at
  FROM "INVOICES" i
 WHERE i.booking_id = CAST(:booking_id AS uuid)
   AND i.customer_id = CAST(:customer_id AS uuid)
 ORDER BY i.created_at DESC
 LIMIT 1;