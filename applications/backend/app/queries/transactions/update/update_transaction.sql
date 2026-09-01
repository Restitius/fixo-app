-- =============================================================================
-- QRY: TRANSACTION.UPDATE
-- Purpose: Update editable fields of an OWNED, non-settled transaction.
-- Params:  transaction_id, user_id, category, counterparty, notes, occurred_at
-- =============================================================================

UPDATE transactions
SET category    = COALESCE(:category, category),
    counterparty = COALESCE(:counterparty, counterparty),
    notes       = COALESCE(:notes, notes),
    occurred_at = COALESCE(:occurred_at, occurred_at),
    updated_at  = CURRENT_TIMESTAMP
WHERE transaction_id = :transaction_id
  AND user_id        = :user_id
  AND status         = 'PENDING';
