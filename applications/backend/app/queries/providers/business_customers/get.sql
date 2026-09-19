-- PROV.BUSINESS_CUSTOMERS.GET - single owned business-customer record
SELECT bc.record_id, bc.customer_id, c.full_name, c.phone, bc.company_name,
       bc.negotiated_rate_type, bc.negotiated_rate_value, bc.notes, bc.status,
       bc.created_at, bc.updated_at
FROM "PROVIDER_BUSINESS_CUSTOMERS" bc
JOIN "CUSTOMERS" c ON c.customer_id = bc.customer_id
WHERE bc.record_id = CAST(:record_id AS uuid)
  AND bc.provider_id = CAST(:user_id AS uuid);
