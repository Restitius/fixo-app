-- PRV.SERVICE.LIST -- the provider's configured services with catalogue context (Provider Req Phase 6)
SELECT ps.service_id,
       ps.display_name, 
       ps.description, 
       ps.years_experience,
       ps.pricing_model, 
       ps.minimum_charge, 
       ps.duration_minutes,
       ps.is_emergency_available, 
       ps.tools, 
       ps.materials, 
       ps.warranty, 
       ps.photos,
       ps.status, 
       ps.review_notes, 
       ps.created_at, 
       ps.updated_at,
       s.name AS service_name, s.slug AS service_slug,
       c.code AS category_code, c.name AS category_name
  FROM "PROVIDER_SERVICES" ps
  JOIN "SERVICES" s ON s.service_id = ps.service_id
  JOIN "SERVICE_CATEGORIES" c ON c.category_id = s.category_id
 WHERE ps.provider_id = CAST(:user_id AS uuid)
   AND ps.status <> 'ARCHIVED'
 ORDER BY c.sort_order, s.name;