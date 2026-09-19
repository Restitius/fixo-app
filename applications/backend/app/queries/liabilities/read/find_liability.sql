-- =============================================================================
-- QRY: LIABILITY.GET_BY_ID
-- Purpose: Fetch ONE owned liability by ID.
-- Params:  liability_id, user_id
-- SECURITY: ownership filter mandatory.
-- =============================================================================

SELECT
    l.liability_id, l.user_id, l.liability_code, l.lender,
    l.principal_amount, l.outstanding_amount, l.interest_rate,
    l.term_months, l.currency, l.started_at, l.closed_at,
    l.notes, l.status, l.created_at, l.updated_at
FROM liabilities AS l
WHERE l.liability_id = :liability_id
  AND l.user_id      = :user_id;
