-- PROV.SETTINGS.PREFERENCE.LIST
SELECT key, value, updated_at FROM "PROVIDER_PREFERENCES"
WHERE provider_id = CAST(:user_id AS uuid)
ORDER BY key;
