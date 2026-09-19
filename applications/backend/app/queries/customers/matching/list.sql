-- CUS.MATCH.LIST — stored candidates for one owned request, best rank first.
SELECT m.match_id, m.provider_id, m.strategy, m.score, m.rank_pos, m.reasons,
       p.display_name, p.headline, p.city, p.rating_avg, p.jobs_completed
  FROM "MATCH_CANDIDATES" m
  JOIN "PROVIDERS" p ON p.provider_id = m.provider_id
 WHERE m.request_id = CAST(:request_id AS uuid)
   AND EXISTS (SELECT 1 FROM "SERVICE_REQUESTS" r
                WHERE r.request_id = m.request_id
                  AND r.customer_id = CAST(:customer_id AS uuid))
 ORDER BY m.rank_pos;