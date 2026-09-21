-- =============================================================================
-- QRY: TRANSACTION.CREATE
-- Purpose: Insert a new financial transaction owned by :user_id.
-- Params:  user_id, transaction_ref, txn_type (CREDIT|DEBIT), category,
--          amount, currency, occurred_at, counterparty, notes
-- =============================================================================

INSERT INTO transactions (
    user_id, transaction_ref, txn_type, category, amount,
    currency, occurred_at, counterparty, notes,
    status, created_at, updated_at
) VALUES (
    :user_id, :transaction_ref, :txn_type, :category, :amount,
    :currency, :occurred_at, :counterparty, :notes,
    'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
