-- =============================================================================
-- QRY: LIABILITY.CREATE
-- Purpose: Insert a new liability (debt) owned by :user_id.
-- Params:  user_id, liability_code, lender, principal_amount, interest_rate,
--          term_months, currency, started_at, notes
-- =============================================================================

INSERT INTO liabilities (
    user_id, liability_code, lender, principal_amount, outstanding_amount,
    interest_rate, term_months, currency, started_at, notes,
    status, created_at, updated_at
) VALUES (
    :user_id, :liability_code, :lender, :principal_amount, :principal_amount,
    :interest_rate, :term_months, :currency, :started_at, :notes,
    'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
