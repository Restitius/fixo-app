-- PROV.SETTINGS.PREFERENCE.SET
INSERT INTO "PROVIDER_PREFERENCES" (provider_id, key, value)
VALUES (CAST(:provider_id AS uuid), :key, :value)
ON CONFLICT (provider_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
RETURNING key, value, updated_at;
