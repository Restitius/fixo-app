-- PROV.CHECKLIST.TEMPLATE.DELETE -- deactivate a provider's template for a service (Phase 21)
UPDATE "JOB_CHECKLIST_TEMPLATES"
   SET is_active  = FALSE,
       updated_at = now()
 WHERE provider_id = CAST(:user_id AS uuid)
   AND service_id  = CAST(:service_id AS uuid)
   AND is_active   = TRUE
RETURNING template_id, provider_id, service_id, is_active, updated_at;