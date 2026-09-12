-- =============================================================================
-- QRY: PROV.COMMISSION.FEES.APPLY
-- Purpose: record a commission/fee application event for a provider.
-- Params:  user_id, currency, gross_amount, commission_amount, tax_amount,
--          net_amount, reference_type, reference_id, description
-- Returns: created fee row.
-- =============================================================================
INSERT INTO \"PROVIDER_COMMISSION_FEES\" (
    provider_id,
    currency,
    gross_amount,
    commission_amount,
    tax_amount,
    net_amount,
    reference_type,
    reference_id,
    description
) VALUES (
    CAST(:user_id AS uuid),
    CAST(:currency AS varchar),
    CAST(:gross_amount AS numeric),
    CAST(:commission_amount AS numeric),
    CAST(:tax_amount AS numeric),
    CAST(:net_amount AS numeric),
    CAST(:reference_type AS varchar),
    CAST(:reference_id AS uuid),
    CAST(:description AS varchar)
)
RETURNING
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
    created_at;
