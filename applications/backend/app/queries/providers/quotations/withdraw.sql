-- PRV.QUOTE.WITHDRAW — withdraw a submitted quote (provider's own)
UPDATE "QUOTATIONS" q
   SET status     = 'WITHDRAWN',
       updated_at = now()
 WHERE q.quote_id = CAST(:quote_id AS uuid)
   AND q.provider_id = CAST(:user_id AS uuid)
   AND q.status = 'SUBMITTED'
RETURNING q.quote_id, q.status, q.updated_at;