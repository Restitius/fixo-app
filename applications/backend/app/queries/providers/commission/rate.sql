-- =============================================================================
-- QRY: PROV.COMMISSION.RATE
-- Purpose: current active commission + tax rate configuration for a provider.
-- Params:  user_id, currency
-- Returns: rate row committed to the provider (provider-specific active row
--          preferred); falls back to a platform default row for the currency
--          only when no provider-specific active row exists.
-- =============================================================================
WITH prov AS (
    SELECT *
    FROM \"PROVIDER_COMMISSION_RATES\"
    WHERE provider_id = CAST(:user_id AS uuid)
      AND is_active
      AND (effective_to IS NULL OR effective_to > now())
      AND currency = CAST(:currency AS varchar)
    ORDER BY effective_from DESC
    LIMIT 1
)
SELECT
    rate_id         AS rate_id,
    provider_id     AS provider_id,
    currency,
    commission_rate AS commission_rate,
    tax_on_commission AS tax_on_commission,
    is_active       AS is_active,
    effective_from  AS effective_from,
    effective_to    AS effective_to,
    created_at      AS created_at,
    updated_at      AS updated_at
FROM prov
UNION ALL
SELECT
    rate_id,
    provider_id,
    currency,
    commission_rate,
    tax_on_commission,
    is_active,
    effective_from,
    effective_to,
    created_at,
    updated_at
FROM \"PROVIDER_COMMISSION_RATES\"
WHERE provider_id IS NULL
  AND is_active
  AND currency = CAST(:currency AS varchar)
  AND (effective_to IS NULL OR effective_to > now())
ORDER BY effective_from DESC
LIMIT 1;
