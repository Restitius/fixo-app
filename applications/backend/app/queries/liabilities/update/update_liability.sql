-- =============================================================================
-- QRY: LIABILITY.UPDATE
-- Purpose: Update editable fields of an OWNED, ACTIVE liability.
-- Params:  liability_id, user_id, lender, notes
-- =============================================================================

UPDATE liabilities
SET lender    = COALESCE(:lender, lender),
    notes     = COALESCE(:notes, notes),
    updated_at = CURRENT_TIMESTAMP
WHERE liability_id = :liability_id
  AND user_id      = :user_id
  AND status       = 'ACTIVE';
