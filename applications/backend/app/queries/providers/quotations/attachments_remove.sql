-- PRV.QUOTE.ATTACHMENTS.REMOVE — delete one attachment from my own quote
DELETE FROM "QUOTATION_ATTACHMENTS" a
 USING "QUOTATIONS" q
 WHERE a.quote_id = q.quote_id
   AND a.attachment_id = CAST(:attachment_id AS uuid)
   AND q.provider_id = CAST(:user_id AS uuid)
   AND q.status IN ('DRAFT', 'SUBMITTED')
RETURNING a.attachment_id;