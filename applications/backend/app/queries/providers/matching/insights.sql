-- PRV.MATCH.INSIGHTS — this provider's match history: why they were matched
-- and what happened (score/rank/strategy/reasons + response + quote outcome)
SELECT mc.match_id, mc.request_id, mc.strategy, mc.score, mc.rank_pos,
       mc.reasons, mc.created_at AS matched_at,
       r.request_number, r.status AS request_status,
       s.name AS service_name,
       resp.response_type, resp.responded_at,
       q.status AS quote_status,
       b.booking_number, b.status AS booking_status
  FROM "MATCH_CANDIDATES" mc
  JOIN "SERVICE_REQUESTS" r ON r.request_id = mc.request_id
  JOIN "SERVICES" s ON s.service_id = r.service_id
  LEFT JOIN "PROVIDER_REQUEST_RESPONSES" resp
    ON resp.provider_id = mc.provider_id AND resp.request_id = mc.request_id
  LEFT JOIN "QUOTATIONS" q
    ON q.request_id = mc.request_id AND q.provider_id = mc.provider_id
  LEFT JOIN "BOOKINGS" b
    ON b.request_id = mc.request_id AND b.provider_id = mc.provider_id
 WHERE mc.provider_id = CAST(:user_id AS uuid)
 ORDER BY mc.created_at DESC
 LIMIT 50;