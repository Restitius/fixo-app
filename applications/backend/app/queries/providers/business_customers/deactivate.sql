-- PROV.BUSINESS_CUSTOMERS.DEACTIVATE - end a negotiated-rate relationship (ownership-scoped)
UPDATE "PROVIDER_BUSINESS_CUSTOMERS"
SET status = 'INACTIVE',
    updated_at = now()
WHERE record_id = CAST(:record_id AS uuid)
  AND provider_id = CAST(:user_id AS uuid)
  AND status = 'ACTIVE'
RETURNING record_id, status, updated_at;
