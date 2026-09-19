-- PROV.BUSINESS_CUSTOMERS.LIST - provider's registered business customers
SELECT bc.record_id, bc.customer_id, c.full_name, c.phone, bc.company_name,
       bc.negotiated_rate_type, bc.negotiated_rate_value, bc.notes, bc.status,
       bc.created_at, bc.updated_at
FROM "PROVIDER_BUSINESS_CUSTOMERS" bc
JOIN "CUSTOMERS" c ON c.customer_id = bc.customer_id
WHERE bc.provider_id = CAST(:user_id AS uuid)
  AND (CAST(:status AS varchar) IS NULL OR bc.status = :status)
ORDER BY bc.created_at DESC
LIMIT :limit OFFSET :offset;
