-- PRV.SERVICE.CATALOG -- active catalogue services a provider can configure (Provider Req Phase 6)
SELECT s.service_id, s.name, s.slug, s.description,
       c.code AS category_code, c.name AS category_name
  FROM "SERVICES" s
  JOIN "SERVICE_CATEGORIES" c ON c.category_id = s.category_id
 WHERE s.is_active
 ORDER BY c.sort_order, s.name;