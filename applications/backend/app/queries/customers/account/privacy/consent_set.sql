-- CUS.PRIVACY.CONSENT.SET
INSERT INTO "CONSENTS" (customer_id, kind, consented)
VALUES (CAST(:user_id AS uuid), :kind, :consented)
ON CONFLICT (customer_id, kind) DO UPDATE
   SET consented = EXCLUDED.consented,
       consented_at = CASE WHEN EXCLUDED.consented THEN COALESCE("CONSENTS".consented_at, now()) ELSE "CONSENTS".consented_at END,
       revoked_at = CASE WHEN NOT EXCLUDED.consented THEN now() ELSE "CONSENTS".revoked_at END
RETURNING kind, consented, consented_at, revoked_at;