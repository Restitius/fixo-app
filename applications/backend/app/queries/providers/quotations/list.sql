-- PRV.QUOTE.LIST — this provider's quotations, newest first
SELECT q.quote_id, q.request_id, r.request_number,
       s.name AS service_name, s.slug AS service_slug,
       q.amount AS total_amount, q.currency, q.status, q.valid_until,
       q.submitted_at, q.updated_at, q.created_at
  FROM "QUOTATIONS" q
  JOIN "SERVICE_REQUESTS" r ON r.request_id = q.request_id
  JOIN "SERVICES" s ON s.service_id = r.service_id
 WHERE q.provider_id = CAST(:user_id AS uuid)
 ORDER BY q.created_at DESC
 LIMIT 50;