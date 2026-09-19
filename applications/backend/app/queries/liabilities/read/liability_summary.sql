-- =============================================================================
-- QRY: LIABILITY.SUMMARY
-- Purpose: Outstanding exposure and weighted average rate for a user.
-- Params:  user_id
-- =============================================================================

SELECT
    l.currency,
    COUNT(*)                                              AS liability_count,
    COALESCE(SUM(l.outstanding_amount), 0)                AS total_outstanding,
    COALESCE(SUM(l.principal_amount), 0)                  AS total_principal,
    COALESCE(SUM(l.outstanding_amount * l.interest_rate)
             / NULLIF(SUM(l.outstanding_amount), 0), 0)   AS weighted_interest_rate
FROM liabilities AS l
WHERE l.user_id = :user_id
  AND l.status  = 'ACTIVE'
GROUP BY l.currency;
