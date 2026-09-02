-- CUS.PROVIDER.LIST_BY_CATEGORY — directory view filtered by service category.
SELECT p.provider_id, p.display_name, p.headline, p.city, p.region,
       p.rating_avg, p.rating_count, p.jobs_completed,
       MIN(ps.base_amount) AS base_amount
  FROM "PROVIDERS" p
  JOIN "PROVIDER_SERVICES" ps ON ps.provider_id = p.provider_id
  JOIN "SERVICES" s ON s.service_id = ps.service_id
 WHERE p.is_active
   AND s.category_id = CAST(:category_id AS uuid)
 GROUP BY p.provider_id, p.display_name, p.headline, p.city, p.region,
          p.rating_avg, p.rating_count, p.jobs_completed
 ORDER BY p.rating_avg DESC, base_amount;
