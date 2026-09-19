-- PRV.SERVICE.SUBMIT -- request platform approval (DRAFT/REJECTED -> PENDING_APPROVAL)
UPDATE "PROVIDER_SERVICES"
   SET status = 'PENDING_APPROVAL', updated_at = now()
 WHERE provider_id = CAST(:user_id AS uuid)
   AND service_id = CAST(:service_id AS uuid)
   AND status IN ('DRAFT', 'REJECTED')
RETURNING service_id, status, updated_at;