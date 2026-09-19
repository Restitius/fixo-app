-- =============================================================================
-- QRY: TRANSACTION.ARCHIVE
-- Purpose: Soft-delete (archive) an OWNED transaction.
-- Params:  transaction_id, user_id
-- =============================================================================

UPDATE transactions
SET status     = 'ARCHIVED',
    updated_at = CURRENT_TIMESTAMP
WHERE transaction_id = :transaction_id
  AND user_id        = :user_id
  AND status        <> 'ARCHIVED';
