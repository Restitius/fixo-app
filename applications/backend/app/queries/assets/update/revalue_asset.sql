-- ASSET.REVALUE - record a new current value on an owned, live asset.
UPDATE "ASSETS"
   SET current_value = :new_value,
       updated_at    = now()
 WHERE asset_id = CAST(:asset_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND status <> 'ARCHIVED'
RETURNING asset_id, current_value;

