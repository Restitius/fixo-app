-- CUS.PUBLIC.SERVICES.BY_CATEGORY
SELECT sv.service_id, sv.name, sv.slug, sv.description, sc.code AS category_code
  FROM "SERVICES" sv
  JOIN "SERVICE_CATEGORIES" sc ON sc.category_id = sv.category_id
 WHERE (CAST(:category_code AS varchar) IS NULL OR sc.code = :category_code)
   AND sv.is_active = TRUE
   AND sc.is_active = TRUE
 ORDER BY sc.sort_order, sv.name;