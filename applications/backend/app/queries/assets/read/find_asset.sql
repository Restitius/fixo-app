-- ASSET.GET_BY_ID - fetch one owned asset (ownership mandatory).
SELECT a.asset_id, a.asset_code, a.customer_id, a.property_id, p.name AS property_name,
       a.name, a.asset_type, a.brand, a.serial_number, a.status,
       a.purchase_value, a.current_value, a.currency, a.purchased_at,
       a.warranty_until, a.last_serviced_at, a.notes
  FROM "ASSETS" a
  LEFT JOIN "PROPERTIES" p ON p.property_id = a.property_id
 WHERE a.asset_id = CAST(:asset_id AS uuid)
   AND a.customer_id = CAST(:customer_id AS uuid);

