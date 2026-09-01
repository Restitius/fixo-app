-- CUS.INVOICE.MARK_PAID — final-money snapshot once captured.
UPDATE "INVOICES"
   SET status = 'PAID',
       paid_at = now()
 WHERE invoice_id = CAST(:invoice_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND status = 'ISSUED'
RETURNING invoice_id, status, paid_at;