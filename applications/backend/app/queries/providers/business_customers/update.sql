-- PROV.BUSINESS_CUSTOMERS.UPDATE - modify negotiated rate/company/notes (ownership-scoped)
UPDATE "PROVIDER_BUSINESS_CUSTOMERS"
SET company_name          = COALESCE(:company_name, company_name),
    negotiated_rate_type  = COALESCE(CAST(:negotiated_rate_type AS varchar), negotiated_rate_type),
    negotiated_rate_value = COALESCE(CAST(:negotiated_rate_value AS numeric), negotiated_rate_value),
    notes                 = COALESCE(:notes, notes),
    updated_at            = now()
WHERE record_id = CAST(:record_id AS uuid)
  AND provider_id = CAST(:user_id AS uuid)
RETURNING record_id, company_name, negotiated_rate_type, negotiated_rate_value, notes, updated_at;
