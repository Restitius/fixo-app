-- =============================================================================
-- QRY: LIABILITY.ARCHIVE
-- Purpose: Soft-delete (archive) an OWNED liability.
-- RULE:    Only zero-balance liabilities may be archived (enforced in policy).
-- Params:  liability_id, user_id
-- =============================================================================

UPDATE liabilities
SET status     = 'ARCHIVED',
    closed_at  = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE liability_id = :liability_id
  AND user_id      = :user_id
  AND status      <> 'ARCHIVED'
  AND outstanding_amount <= 0;
