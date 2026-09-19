-- CUS.HOME.DASHBOARD — the whole customer environment in ONE round-trip.
-- Home is an aggregator: counts + curated picks, no cross-domain table writes.
SELECT
    (SELECT count(*) FROM "PROPERTIES" p
      WHERE p.customer_id = CAST(:customer_id AS uuid) AND p.is_active)          AS property_count,

    (SELECT count(*) FROM "CUSTOMER_ADDRESSES" a
      WHERE a.customer_id = CAST(:customer_id AS uuid)
        AND a.deleted_at IS NULL)                                                AS address_count,

    (SELECT count(*) FROM "CUSTOMER_ADDRESSES" a
      WHERE a.customer_id = CAST(:customer_id AS uuid)
        AND a.is_default AND a.deleted_at IS NULL)                               AS has_default_address,

    COALESCE((
        SELECT json_agg(json_build_object(
                   'category_id', c.category_id, 'code', c.code,
                   'name', c.name, 'icon', c.icon) ORDER BY c.sort_order)
          FROM "SERVICE_CATEGORIES" c
         WHERE c.is_active
    ), '[]'::json)                                                               AS categories,

    COALESCE((
        SELECT json_agg(json_build_object(
                   'service_id', s.service_id, 'name', s.name,
                   'slug', s.slug, 'description', s.description))
          FROM (SELECT service_id, name, slug, description
                  FROM "SERVICES"
                 WHERE is_active
                 ORDER BY created_at
                 LIMIT 6) s
    ), '[]'::json)                                                               AS popular_services;