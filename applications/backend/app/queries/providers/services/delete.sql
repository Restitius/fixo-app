-- PRV.SERVICE.DELETE -- archive the configuration (soft delete; historical references preserved)
UPDATE "PROVIDER_SERVICES"
   SET status = 'ARCHIVED', updated_at = now()
 WHERE provider_id = CAST(:user_id AS uuid)
   AND service_id = CAST(:service_id AS uuid)
   AND status <> 'ARCHIVED'
RETURNING service_id, status;