-- ASSET.LIST - paginated, filtered list of owned assets.
SELECT a.asset_id, a.asset_code, a.name, a.asset_type, a.status,
       a.purchase_value, a.current_value, a.currency, a.purchased_at,
       a.warranty_until, a.next_service_due, a.notes,
       a.property_id, p.name AS property_name
  FROM (
       SELECT a.*, (a.last_serviced_at::date + 180) AS next_service_due
         FROM "ASSETS" a
        WHERE a.customer_id = CAST(:customer_id AS uuid)
          AND a.status <> 'ARCHIVED'
          AND (CAST(:asset_type AS varchar) IS NULL OR a.asset_type = :asset_type)
          AND (CAST(:search AS varchar) IS NULL OR a.name ILIKE '%' || CAST(:search AS varchar) || '%')
       ) a
  LEFT JOIN "PROPERTIES" p ON p.property_id = a.property_id
 ORDER BY a.created_at DESC
 LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);

