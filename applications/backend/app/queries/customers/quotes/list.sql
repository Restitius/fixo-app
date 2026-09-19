-- CUS.QUOTES.LIST — all quotes of one owned request with provider identity.
SELECT q.quote_id, q.provider_id, q.amount, q.currency, q.lead_time_days,
       q.message, q.status, q.valid_until, q.created_at,
       p.display_name, p.headline, p.rating_avg
  FROM "QUOTATIONS" q
  JOIN "PROVIDERS" p ON p.provider_id = q.provider_id
 WHERE q.request_id = CAST(:request_id AS uuid)
   AND EXISTS (SELECT 1 FROM "SERVICE_REQUESTS" r
                WHERE r.request_id = q.request_id
                  AND r.customer_id = CAST(:customer_id AS uuid))
 ORDER BY (q.status = 'ACCEPTED') DESC, q.amount;