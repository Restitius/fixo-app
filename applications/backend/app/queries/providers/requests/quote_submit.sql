-- PRV.REQUESTS.QUOTE.SUBMIT — submit this provider's quote for a matched request;
-- guarded to live feed items without an existing quote (UNIQUE backstop too)
INSERT INTO "QUOTATIONS" (
    request_id, provider_id, amount, currency, lead_time_days, message, status
)
SELECT CAST(:request_id AS uuid), CAST(:user_id AS uuid),
       :amount, :currency, :lead_time_days, :message, 'SUBMITTED'
 WHERE EXISTS (SELECT 1
                 FROM "MATCH_CANDIDATES" mc
                 JOIN "SERVICE_REQUESTS" r ON r.request_id = mc.request_id
                WHERE mc.provider_id = CAST(:user_id AS uuid)
                  AND mc.request_id = CAST(:request_id AS uuid)
                  AND r.status IN ('VALID', 'SUBMITTED'))
   AND NOT EXISTS (SELECT 1 FROM "QUOTATIONS" q
                    WHERE q.request_id = CAST(:request_id AS uuid)
                      AND q.provider_id = CAST(:user_id AS uuid))
RETURNING quote_id, request_id, provider_id, amount, currency,
          lead_time_days, message, status, valid_until, created_at;