-- PRV.QUOTE.ATTACHMENTS.ADD — attach a photo/document to my own quote
INSERT INTO "QUOTATION_ATTACHMENTS" (quote_id, provider_id, kind, url, label)
SELECT CAST(:quote_id AS uuid), CAST(:user_id AS uuid), :kind, :url, :label
 WHERE EXISTS (SELECT 1 FROM "QUOTATIONS" q
                WHERE q.quote_id = CAST(:quote_id AS uuid)
                  AND q.provider_id = CAST(:user_id AS uuid)
                  AND q.status IN ('DRAFT', 'SUBMITTED'))
RETURNING attachment_id, quote_id, kind, url, label, created_at;