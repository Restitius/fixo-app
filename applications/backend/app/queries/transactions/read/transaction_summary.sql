-- =============================================================================
-- QRY: TRANSACTION.SUMMARY
-- Purpose: Credit/debit/net totals for a user over a period.
-- Params:  user_id, date_from, date_to
-- =============================================================================

SELECT
    t.currency,
    COALESCE(SUM(CASE WHEN t.txn_type = 'CREDIT' THEN t.amount ELSE 0 END), 0) AS total_credit,
    COALESCE(SUM(CASE WHEN t.txn_type = 'DEBIT'  THEN t.amount ELSE 0 END), 0) AS total_debit,
    COALESCE(SUM(CASE WHEN t.txn_type = 'CREDIT' THEN t.amount ELSE -t.amount END), 0) AS net_amount,
    COUNT(*) AS transaction_count
FROM transactions AS t
WHERE t.user_id = :user_id
  AND t.status <> 'ARCHIVED'
  AND (:date_from IS NULL OR t.occurred_at >= :date_from)
  AND (:date_to   IS NULL OR t.occurred_at <  :date_to)
GROUP BY t.currency;
