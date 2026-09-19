-- ASSET.ARCHIVE - soft-delete an owned asset; rows are never hard-deleted.
UPDATE "ASSETS"
   SET status = 'ARCHIVED',
       archived_at = now(),
       updated_at = now()
 WHERE asset_id = CAST(:asset_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND status <> 'ARCHIVED'
RETURNING asset_id, status;

