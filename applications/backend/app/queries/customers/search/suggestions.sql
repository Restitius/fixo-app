-- CUS.SEARCH.SUGGESTIONS — quick autocomplete from service names.
SELECT s.service_id, s.slug, s.name,
       c.code AS category_code
  FROM "SERVICES" s
  JOIN "SERVICE_CATEGORIES" c ON c.category_id = s.category_id
 WHERE s.is_active
   AND c.is_active
   AND s.name ILIKE :prefix
 ORDER BY s.sort_order, s.name
 LIMIT CAST(:limit AS int);