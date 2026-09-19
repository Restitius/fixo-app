-- =============================================================================
-- QRY: LIABILITY.RESTRUCTURE
-- Purpose: Restructure terms (rate/term months) of an ACTIVE liability.
-- Params:  liability_id, user_id, interest_rate, term_months
-- RULE:    Approved/settled liabilities cannot be restructured directly.
-- =============================================================================

UPDATE liabilities
SET interest_rate = :interest_rate,
    term_months   = :term_months,
    updated_at    = CURRENT_TIMESTAMP
WHERE liability_id = :liability_id
  AND user_id      = :user_id
  AND status       = 'ACTIVE';
