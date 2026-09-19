-- PROV.SETTINGS.PRIVACY.EXPORT.REQUEST
INSERT INTO "PROVIDER_DATA_EXPORT_REQUESTS" (provider_id)
VALUES (CAST(:provider_id AS uuid))
RETURNING request_id, status, requested_at;
