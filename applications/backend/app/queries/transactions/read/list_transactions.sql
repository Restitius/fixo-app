-- =============================================================================
-- QRY: TRANSACTION.LIST
-- Purpose: Paginated, filtered list of OWNED transactions.
-- Params:  user_id (MANDATORY), txn_type, category, date_from, date_to,
--          limit, offset
-- =============================================================================

SELECT
    t.transaction_id, t.transaction_ref, t.txn_type, t.category,
    t.amount, t.currency, t.occurred_at, t.counterparty, t.status
FROM transactions AS t
WHERE t.user_id = :user_id
  AND (:txn_type IS NULL OR t.txn_type = :txn_type)
  AND (:category IS NULL OR t.category = :category)
  AND (:date_from IS NULL OR t.occurred_at >= :date_from)
  AND (:date_to IS NULL OR t.occurred_at <  :date_to)
ORDER BY t.occurred_at DESC
LIMIT :limit OFFSET :offset;
