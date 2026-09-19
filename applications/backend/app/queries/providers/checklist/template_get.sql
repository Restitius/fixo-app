-- PROV.CHECKLIST.TEMPLATE.GET -- read a provider's template for a service (Phase 21)
SELECT template_id, provider_id, service_id, title, items, is_active, created_at, updated_at
  FROM "JOB_CHECKLIST_TEMPLATES"
 WHERE provider_id = CAST(:user_id AS uuid)
   AND service_id  = CAST(:service_id AS uuid);