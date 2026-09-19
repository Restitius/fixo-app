-- CUS.PRIVACY.CONSENT.LIST
SELECT kind, consented, consented_at, revoked_at
FROM "CONSENTS"
WHERE customer_id = CAST(:user_id AS uuid)
ORDER BY kind;