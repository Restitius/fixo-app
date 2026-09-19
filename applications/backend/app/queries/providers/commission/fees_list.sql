-- =============================================================================
-- QRY: PROV.COMMISSION.FEES.LIST
-- Purpose: provider commission/fee application history, newest first.
-- Params:  user_id, status, limit, offset
-- Returns: fee rows with optional status filter.
-- =============================================================================
SELECT
    fee_id,
    provider_id,
    currency,
    gross_amount,
    commission_amount,
    tax_amount,
    net_amount,
    status,
    reference_type,
    reference_id,
    description,
    created_at
FROM "PROVIDER_COMMISSION_FEES"
WHERE provider_id = CAST(:user_id AS uuid)
  AND (CAST(:status AS varchar) IS NULL OR status = CAST(:status AS varchar))
ORDER BY created_at DESC
LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);
