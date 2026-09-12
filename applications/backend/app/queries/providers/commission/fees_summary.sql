-- =============================================================================
-- QRY: PROV.COMMISSION.FEES.SUMMARY
-- Purpose: totals for a provider's commission/fee events.
-- Params:  user_id
-- Returns: gross total, commission total, tax total, net total, event count.
-- =============================================================================
SELECT
    COALESCE(SUM(gross_amount), 0)     AS total_gross,
    COALESCE(SUM(commission_amount), 0) AS total_commission,
    COALESCE(SUM(tax_amount), 0)        AS total_tax,
    COALESCE(SUM(net_amount), 0)        AS total_net,
    COUNT(*)                            AS fee_count
FROM \"PROVIDER_COMMISSION_FEES\"
WHERE provider_id = CAST(:user_id AS uuid);
