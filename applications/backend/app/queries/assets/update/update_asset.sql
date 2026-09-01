-- ASSET.UPDATE - update editable fields of an owned, live asset.
UPDATE "ASSETS"
   SET name            = COALESCE(:name, name),
       asset_type      = COALESCE(lower(:asset_type), asset_type),
       brand           = COALESCE(:brand, brand),
       serial_number   = COALESCE(:serial_number, serial_number),
       property_id     = COALESCE(CAST(:property_id AS uuid), property_id),
       purchased_at    = COALESCE(CAST(:purchased_at AS date), purchased_at),
       warranty_until  = COALESCE(CAST(:warranty_until AS date), warranty_until),
       notes           = COALESCE(:notes, notes),
       updated_at      = now()
 WHERE asset_id = CAST(:asset_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND status <> 'ARCHIVED'
RETURNING asset_id, name, updated_at;

