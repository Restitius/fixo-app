-- CUS.CATALOG.SERVICE.GET — detail by slug with category info + related services.
SELECT s.service_id, s.slug, s.name, s.description, s.icon,
       c.category_id, c.code AS category_code, c.name AS category_name,
       COALESCE((
           SELECT json_agg(json_build_object(
                      'service_id', r.service_id, 'slug', r.slug,
                      'name', r.name, 'icon', r.icon))
             FROM (SELECT service_id, slug, name, icon
                     FROM "SERVICES"
                    WHERE category_id = s.category_id
                      AND is_active
                      AND service_id <> s.service_id
                    ORDER BY sort_order, name
                    LIMIT 4) r
       ), '[]'::json) AS related_services
  FROM "SERVICES" s
  JOIN "SERVICE_CATEGORIES" c ON c.category_id = s.category_id
 WHERE s.slug = :slug
   AND s.is_active
   AND c.is_active;