-- PRV.QUOTE.SUBMIT — publish a DRAFT quote into the marketplace
WITH changed AS (
    UPDATE "QUOTATIONS" q
       SET status       = 'SUBMITTED',
           submitted_at = now(),
           updated_at   = now()
     WHERE q.quote_id = CAST(:quote_id AS uuid)
       AND q.provider_id = CAST(:user_id AS uuid)
       AND q.status = 'DRAFT'
    RETURNING q.quote_id, q.request_id, q.status, q.submitted_at
), queued AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.QUOTE.SUBMITTED.V1', 'customer', r.customer_id,
           jsonb_build_object(
               'request_id', r.request_id,
               'request_number', r.request_number,
               'quote_id', changed.quote_id
           )
      FROM changed
      JOIN "SERVICE_REQUESTS" r ON r.request_id = changed.request_id
)
SELECT quote_id, status, submitted_at FROM changed;
