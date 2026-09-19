-- PRV.VER.PROVIDER.STATUS.SET -- platform-side verification status transition (Provider Req Phase 5)
-- Platform-side operation: the admin route guard lands with the platform admin
-- module. :user_id binds the affected provider's id (validator convention).
UPDATE "PROVIDERS"
   SET verification_status = :status,
       updated_at = now()
 WHERE provider_id = CAST(:user_id AS uuid)
RETURNING verification_status;
