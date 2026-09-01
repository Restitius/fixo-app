-- CUS.INVOICE.ISSUE — flip DRAFT → ISSUED with a timestamp.
UPDATE "INVOICES"
   SET status = 'ISSUED',
       issued_at = now()
 WHERE invoice_id = CAST(:invoice_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND status = 'DRAFT'
RETURNING invoice_id, invoice_number, status, issued_at;