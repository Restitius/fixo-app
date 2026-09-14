-- PROV.ACTIVITY_LOG.RECORD - append one activity entry (internal use only,
-- called by services after a significant action; not provider-writable
-- via any endpoint).
INSERT INTO "PROVIDER_ACTIVITY_LOG" (provider_id, action, entity_type, entity_id, metadata)
VALUES (
    CAST(:provider_id AS uuid), :action, :entity_type, CAST(:entity_id AS uuid), CAST(:metadata AS jsonb)
)
RETURNING log_id, action, entity_type, entity_id, metadata, created_at;
