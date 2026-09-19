-- PROV.ACTIVITY_LOG.LIST - the provider's own activity/audit history
SELECT log_id, action, entity_type, entity_id, metadata, created_at
FROM "PROVIDER_ACTIVITY_LOG"
WHERE provider_id = CAST(:user_id AS uuid)
  AND (CAST(:action_prefix AS varchar) IS NULL OR action LIKE :action_prefix || '%')
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
