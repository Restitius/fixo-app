-- PRV.QUOTE.EXPIRE — mark this provider's stale submitted quotes as EXPIRED
UPDATE "QUOTATIONS" q
   SET status     = 'EXPIRED',
       updated_at = now()
 WHERE q.provider_id = CAST(:user_id AS uuid)
   AND q.status = 'SUBMITTED'
   AND q.valid_until < now()
RETURNING q.quote_id, q.status;