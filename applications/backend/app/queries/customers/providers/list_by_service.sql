-- CUS.PROVIDER.LIST_BY_SERVICE — directory view filtered by service slug.
SELECT DISTINCT p.provider_id, p.display_name, p.headline, p.city, p.region,
       p.rating_avg, p.rating_count, p.jobs_completed, ps.base_amount
  FROM "PROVIDERS" p
  JOIN "PROVIDER_SERVICES" ps ON ps.provider_id = p.provider_id
  JOIN "SERVICES" s ON s.service_id = ps.service_id
 WHERE p.is_active
   AND p.verification_status = 'VERIFIED'
   AND s.slug = :slug
 ORDER BY p.rating_avg DESC, ps.base_amount;