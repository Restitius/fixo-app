-- CUS.PROVIDER.PROFILE — public profile with offered services pre-aggregated.
SELECT p.provider_id, p.display_name, p.headline, p.bio,
       p.city, p.region, p.rating_avg, p.rating_count,
       p.jobs_completed, p.created_at,
       COALESCE((
           SELECT json_agg(json_build_object(
                      'service_id', s.service_id, 'slug', s.slug,
                      'name', s.name, 'base_amount', ps.base_amount)
                      ORDER BY s.name)
             FROM "PROVIDER_SERVICES" ps
             JOIN "SERVICES" s ON s.service_id = ps.service_id
            WHERE ps.provider_id = p.provider_id
       ), '[]'::json) AS services
  FROM "PROVIDERS" p
 WHERE p.provider_id = CAST(:provider_id AS uuid)
   AND p.is_active
   AND p.verification_status = 'VERIFIED';