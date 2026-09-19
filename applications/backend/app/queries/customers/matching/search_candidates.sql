-- CUS.MATCH.PROVIDERS.SEARCH — candidate pool: offers the service, active,
-- located in the request's city or region. repeat_customer flags prior
-- ACCEPTED-quote history with this customer (drives MATCH.REPEAT_PROVIDER).
SELECT p.provider_id, p.display_name, p.city, p.region,
       p.rating_avg, p.rating_count, p.jobs_completed,
       ps.base_amount,
       EXISTS (
           SELECT 1
             FROM "QUOTATIONS" q
             JOIN "SERVICE_REQUESTS" r ON r.request_id = q.request_id
            WHERE q.provider_id = p.provider_id
              AND q.status = 'ACCEPTED'
              AND r.customer_id = CAST(:customer_id AS uuid)
       ) AS repeat_customer
  FROM "PROVIDER_SERVICES" ps
  JOIN "PROVIDERS" p ON p.provider_id = ps.provider_id
 WHERE ps.service_id = CAST(:service_id AS uuid)
   AND p.is_active
   AND (p.city = COALESCE(NULLIF(:city, ''), p.city)
        OR p.region = COALESCE(NULLIF(:region, ''), p.region))
 ORDER BY p.rating_avg DESC;