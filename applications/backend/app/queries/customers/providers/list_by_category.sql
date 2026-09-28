-- CUS.PROVIDER.LIST_BY_CATEGORY — directory view filtered by service category.
-- Any active provider with an APPROVED listing is shown; verification is exposed
-- (and ranked first) rather than used to hide providers.
SELECT p.provider_id, p.display_name, p.headline, p.city, p.region,
       p.rating_avg, p.rating_count, p.jobs_completed,
       MIN(ps.base_amount) AS base_amount,
       p.verification_status,
       (p.verification_status = 'VERIFIED') AS is_verified
  FROM "PROVIDERS" p
  JOIN "PROVIDER_SERVICES" ps ON ps.provider_id = p.provider_id
                             AND ps.status = 'APPROVED'
  JOIN "SERVICES" s ON s.service_id = ps.service_id
 WHERE p.is_active
   AND s.category_id = CAST(:category_id AS uuid)
 GROUP BY p.provider_id, p.display_name, p.headline, p.city, p.region,
          p.rating_avg, p.rating_count, p.jobs_completed, p.verification_status
 ORDER BY (p.verification_status = 'VERIFIED') DESC, p.rating_avg DESC, base_amount;
