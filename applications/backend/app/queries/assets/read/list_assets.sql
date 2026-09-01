-- ASSET.LIST - paginated, filtered list of owned assets.
SELECT a.asset_id, a.asset_code, a.name, a.asset_type, a.status,
       a.current_value, a.currency, a.warranty_until, a.next_service_due
  FROM (
       SELECT a.*, (a.last_serviced_at::date + 180) AS next_service_due
         FROM "ASSETS" a
        WHERE a.customer_id = CAST(:customer_id AS uuid)
          AND a.status <> 'ARCHIVED'
          AND (CAST(:asset_type AS varchar) IS NULL OR a.asset_type = :asset_type)
          AND (:search IS NULL OR a.name ILIKE '%' || :search || '%')
       ) a
 ORDER BY a.created_at DESC
 LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);

