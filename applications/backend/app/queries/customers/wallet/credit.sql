-- CUS.WALLET.CREDIT - row-locked balance bump + ledger entry in one statement
WITH cur AS (
    SELECT wallet_id, currency FROM "WALLETS"
    WHERE customer_id = CAST(:user_id AS uuid)
    FOR UPDATE
), upd AS (
    UPDATE "WALLETS" w
       SET balance = w.balance + :amount, version = w.version + 1, updated_at = now()
     WHERE w.wallet_id = (SELECT wallet_id FROM cur)
    RETURNING w.balance
)
INSERT INTO "WALLET_LEDGER" (wallet_id, customer_id, entry_type, amount, running_balance, currency)
SELECT c.wallet_id, CAST(:user_id AS uuid), 'CREDIT', :amount, u.balance, c.currency
FROM cur c, upd u
WHERE :amount > 0
RETURNING entry_id, entry_type, amount, running_balance, currency, created_at;
