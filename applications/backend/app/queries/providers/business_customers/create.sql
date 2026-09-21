-- PROV.BUSINESS_CUSTOMERS.CREATE - register a business customer with a negotiated rate
INSERT INTO "PROVIDER_BUSINESS_CUSTOMERS" (
    provider_id, customer_id, company_name, negotiated_rate_type, negotiated_rate_value, notes
)
SELECT
    CAST(:provider_id AS uuid), CAST(:customer_id AS uuid), :company_name,
    :negotiated_rate_type, CAST(:negotiated_rate_value AS numeric), :notes
WHERE EXISTS (SELECT 1 FROM "CUSTOMERS" c WHERE c.customer_id = CAST(:customer_id AS uuid))
RETURNING record_id, provider_id, customer_id, company_name, negotiated_rate_type,
          negotiated_rate_value, notes, status, created_at;
