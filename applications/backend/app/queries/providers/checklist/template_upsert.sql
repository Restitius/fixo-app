-- PROV.CHECKLIST.TEMPLATE.UPSERT -- save a provider's checklist template per service (Phase 21)
-- Idempotent per (provider, service). items is a JSON array of plain task
-- titles, e.g. ["Inspect unit","Clean filters"].
INSERT INTO "JOB_CHECKLIST_TEMPLATES" (provider_id, service_id, title, items, is_active)
VALUES (CAST(:user_id AS uuid), CAST(:service_id AS uuid), :title, CAST(:items AS json), TRUE)
ON CONFLICT (provider_id, service_id) DO UPDATE
   SET title       = EXCLUDED.title,
       items       = EXCLUDED.items,
       is_active   = TRUE,
       updated_at  = now()
RETURNING template_id, provider_id, service_id, title, items, is_active, updated_at;