-- CUS.WALLET.REFUND_ONCE - credit a booking refund at most once per booking.
WITH cur AS (
    SELECT wallet_id, currency FROM "WALLETS"
    WHERE customer_id = CAST(:user_id AS uuid)
    FOR UPDATE
), already AS (
    SELECT 1 FROM "WALLET_LEDGER"
     WHERE reference_type = 'BOOKING_REFUND'
       AND reference_id = CAST(:reference_id AS uuid)
), upd AS (
    UPDATE "WALLETS" w
       SET balance = w.balance + :amount, version = w.version + 1, updated_at = now()
     WHERE w.wallet_id = (SELECT wallet_id FROM cur)
       AND NOT EXISTS (SELECT 1 FROM already)
    RETURNING w.balance
)
INSERT INTO "WALLET_LEDGER" (wallet_id, customer_id, entry_type, amount, running_balance, currency,
                             reference_type, reference_id, description)
SELECT c.wallet_id, CAST(:user_id AS uuid), 'CREDIT', :amount, u.balance, c.currency,
       'BOOKING_REFUND', CAST(:reference_id AS uuid), CAST(:description AS varchar)
FROM cur c, upd u
WHERE :amount > 0
RETURNING entry_id, entry_type, amount, running_balance, currency, created_at;
