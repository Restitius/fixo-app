-- CUS.WALLET.DEBIT - guarded by sufficient balance (no overdraft)
-- Optional reference_* / description record why the money moved on the ledger.
WITH cur AS (
    SELECT wallet_id, currency, balance FROM "WALLETS"
    WHERE customer_id = CAST(:user_id AS uuid)
    FOR UPDATE
), upd AS (
    UPDATE "WALLETS" w
       SET balance = w.balance - :amount, version = w.version + 1, updated_at = now()
     WHERE w.wallet_id = (SELECT wallet_id FROM cur)
       AND w.balance >= :amount
    RETURNING w.balance
)
INSERT INTO "WALLET_LEDGER" (wallet_id, customer_id, entry_type, amount, running_balance, currency,
                             reference_type, reference_id, description)
SELECT c.wallet_id, CAST(:user_id AS uuid), 'DEBIT', :amount, u.balance, c.currency,
       CAST(:reference_type AS varchar), CAST(:reference_id AS uuid), CAST(:description AS varchar)
FROM cur c, upd u
WHERE :amount > 0
RETURNING entry_id, entry_type, amount, running_balance, currency, created_at;
