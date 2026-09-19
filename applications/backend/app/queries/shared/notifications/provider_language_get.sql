-- NTF.PROVIDER_LANGUAGE.GET — recipient contact + preferred_language for delivery.
SELECT preferred_language, phone, email
FROM "PROVIDERS" WHERE provider_id = CAST(:provider_id AS uuid);
