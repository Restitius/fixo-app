-- PROV.EARNINGS.TRANSACTIONS — every earnings transaction for a provider (Phase 28).
-- Transaction = one invoice (the money event on the platform). Latest first.
SELECT i.invoice_id, i.invoice_number, i.booking_id,
       i.total_amount, i.currency, i.status, i.issued_at, i.paid_at, i.created_at,
       b.booking_number,
       c.full_name AS customer_name,
       s.name      AS service_name
  FROM "INVOICES" i
  JOIN "BOOKINGS"   b ON b.booking_id = i.booking_id
  JOIN "CUSTOMERS"  c ON c.customer_id = i.customer_id
  LEFT JOIN "SERVICES" s ON s.service_id = b.service_id
 WHERE i.provider_id = CAST(:user_id AS uuid)
 ORDER BY i.created_at DESC
 LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);