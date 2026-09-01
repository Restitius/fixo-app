-- CUS.CATALOG.CATEGORIES — active categories with live service counts.
SELECT c.category_id, c.code, c.name, c.description, c.icon,
       count(s.service_id) FILTER (WHERE s.is_active) AS service_count
  FROM "SERVICE_CATEGORIES" c
  LEFT JOIN "SERVICES" s ON s.category_id = c.category_id
 WHERE c.is_active
 GROUP BY c.category_id, c.code, c.name, c.description, c.icon, c.sort_order
 ORDER BY c.sort_order;