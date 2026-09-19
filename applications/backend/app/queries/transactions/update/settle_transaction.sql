-- =============================================================================
-- QRY: TRANSACTION.SETTLE
-- Purpose: Mark a PENDING transaction as SETTLED.
-- Params:  transaction_id, user_id, settled_at
-- =============================================================================

UPDATE transactions
SET status     = 'SETTLED',
    settled_at = COALESCE(:settled_at, CURRENT_TIMESTAMP),
    updated_at = CURRENT_TIMESTAMP
WHERE transaction_id = :transaction_id
  AND user_id        = :user_id
  AND status         = 'PENDING';
