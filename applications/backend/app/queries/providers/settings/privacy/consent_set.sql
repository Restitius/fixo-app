-- PROV.SETTINGS.PRIVACY.CONSENT.SET
INSERT INTO "PROVIDER_CONSENTS" (provider_id, kind, consented)
VALUES (CAST(:provider_id AS uuid), :kind, :consented)
ON CONFLICT (provider_id, kind) DO UPDATE
   SET consented = EXCLUDED.consented,
       consented_at = CASE WHEN EXCLUDED.consented THEN COALESCE("PROVIDER_CONSENTS".consented_at, now()) ELSE "PROVIDER_CONSENTS".consented_at END,
       revoked_at = CASE WHEN NOT EXCLUDED.consented THEN now() ELSE "PROVIDER_CONSENTS".revoked_at END
RETURNING kind, consented, consented_at, revoked_at;
