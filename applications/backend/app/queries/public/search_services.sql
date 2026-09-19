-- CUS.PUBLIC.SERVICES.SEARCH - public search over categories and services
SELECT sv.service_id, sv.name, sv.slug, sv.description,
       sc.code AS category_code, sc.name AS category_name
  FROM "SERVICES" sv
  JOIN "SERVICE_CATEGORIES" sc ON sc.category_id = sv.category_id
 WHERE sv.is_active = TRUE
   AND (
     sv.name ILIKE :term
     OR COALESCE(sv.description, '') ILIKE :term
     OR sc.name ILIKE :term
   )
 ORDER BY sc.sort_order, sv.name
 LIMIT 25;