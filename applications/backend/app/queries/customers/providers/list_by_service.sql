-- CUS.PROVIDER.LIST_BY_SERVICE — directory view filtered by service slug.
-- Any active provider with an APPROVED listing is shown; verification is exposed
-- (and ranked first) rather than used to hide providers, so matched providers
-- can always be opened and compared.
SELECT p.provider_id, p.display_name, p.headline, p.city, p.region,
       p.rating_avg, p.rating_count, p.jobs_completed, ps.base_amount,
       p.verification_status,
       (p.verification_status = 'VERIFIED') AS is_verified
  FROM "PROVIDERS" p
  JOIN "PROVIDER_SERVICES" ps ON ps.provider_id = p.provider_id
                             AND ps.status = 'APPROVED'
  JOIN "SERVICES" s ON s.service_id = ps.service_id
 WHERE p.is_active
   AND s.slug = :slug
 ORDER BY (p.verification_status = 'VERIFIED') DESC, p.rating_avg DESC, ps.base_amount;
