-- PRV.QUOTE.ATTACHMENTS.LIST — photos/documents on one of my quotations
SELECT a.attachment_id, a.quote_id, a.kind, a.url, a.label, a.created_at
  FROM "QUOTATION_ATTACHMENTS" a
  JOIN "QUOTATIONS" q ON q.quote_id = a.quote_id
 WHERE q.quote_id = CAST(:quote_id AS uuid)
   AND q.provider_id = CAST(:user_id AS uuid)
 ORDER BY a.created_at;