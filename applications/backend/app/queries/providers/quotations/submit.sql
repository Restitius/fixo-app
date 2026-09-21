-- PRV.QUOTE.SUBMIT — publish a DRAFT quote into the marketplace
UPDATE "QUOTATIONS" q
   SET status       = 'SUBMITTED',
       submitted_at = now(),
       updated_at   = now()
 WHERE q.quote_id = CAST(:quote_id AS uuid)
   AND q.provider_id = CAST(:user_id AS uuid)
   AND q.status = 'DRAFT'
RETURNING q.quote_id, q.status, q.submitted_at;