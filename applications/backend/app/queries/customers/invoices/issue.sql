-- CUS.INVOICE.ISSUE — flip DRAFT → ISSUED with a timestamp, writing the
-- NTF.INVOICE.ISSUED.V1 outbox row atomically.
WITH upd AS (
    UPDATE "INVOICES"
       SET status = 'ISSUED',
           issued_at = now()
     WHERE invoice_id = CAST(:invoice_id AS uuid)
       AND customer_id = CAST(:customer_id AS uuid)
       AND status = 'DRAFT'
    RETURNING invoice_id, invoice_number, status, issued_at, customer_id,
              total_amount, currency
), outbox_ins AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.INVOICE.ISSUED.V1', 'customer', upd.customer_id,
           jsonb_build_object(
               'invoice_id', upd.invoice_id, 'invoice_number', upd.invoice_number,
               'total_amount', upd.total_amount, 'currency', upd.currency
           )
      FROM upd
    RETURNING outbox_id
)
SELECT upd.invoice_id, upd.invoice_number, upd.status, upd.issued_at
  FROM upd
  LEFT JOIN (SELECT count(*) FROM outbox_ins) AS _outbox_forced ON true;
