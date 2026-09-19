-- =============================================================================
-- QRY: TRANSACTION.GET_BY_ID
-- Purpose: Fetch ONE owned transaction by ID.
-- Params:  transaction_id, user_id
-- SECURITY: ownership filter mandatory.
-- =============================================================================

SELECT
    t.transaction_id, t.user_id, t.transaction_ref, t.txn_type,
    t.category, t.amount, t.currency, t.occurred_at,
    t.counterparty, t.notes, t.status,
    t.created_at, t.updated_at
FROM transactions AS t
WHERE t.transaction_id = :transaction_id
  AND t.user_id        = :user_id;
