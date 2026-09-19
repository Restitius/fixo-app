-- =============================================================================
-- QRY: LIABILITY.LIST
-- Purpose: Paginated, filtered list of OWNED liabilities.
-- Params:  user_id (MANDATORY), status, lender, limit, offset
-- =============================================================================

SELECT
    l.liability_id, l.liability_code, l.lender,
    l.outstanding_amount, l.interest_rate, l.term_months,
    l.currency, l.started_at, l.status
FROM liabilities AS l
WHERE l.user_id = :user_id
  AND (:status IS NULL OR l.status = :status)
  AND (:lender IS NULL OR l.lender LIKE '%' || :lender || '%')
ORDER BY l.started_at DESC
LIMIT :limit OFFSET :offset;
