-- PROV.SETTINGS.PRIVACY.CONSENT.LIST
SELECT kind, consented, consented_at, revoked_at
FROM "PROVIDER_CONSENTS"
WHERE provider_id = CAST(:user_id AS uuid)
ORDER BY kind;
