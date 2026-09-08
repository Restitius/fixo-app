-- PRV.REQUESTS.QUOTES.LIST — this provider's submitted quotes
SELECT q.quote_id, q.request_id, q.amount, q.currency, q.lead_time_days,
       q.message, q.status, q.valid_until, q.created_at,
       r.request_number, s.name AS service_name
  FROM "QUOTATIONS" q
  JOIN "SERVICE_REQUESTS" r ON r.request_id = q.request_id
  JOIN "SERVICES" s ON s.service_id = r.service_id
 WHERE q.provider_id = CAST(:user_id AS uuid)
 ORDER BY q.created_at DESC
 LIMIT 50;