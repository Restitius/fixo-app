-- ASSET.SUMMARY - portfolio totals grouped by status and type.
SELECT status, asset_type,
       COUNT(*)::int AS asset_count,
       COALESCE(SUM(purchase_value), 0) AS total_purchase_value,
       COALESCE(SUM(current_value), 0)  AS total_current_value,
       currency
  FROM "ASSETS"
 WHERE customer_id = CAST(:customer_id AS uuid)
   AND status <> 'ARCHIVED'
 GROUP BY status, asset_type, currency
 ORDER BY status, asset_type;

