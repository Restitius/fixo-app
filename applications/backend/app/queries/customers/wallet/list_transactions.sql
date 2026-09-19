-- CUS.WALLET.LIST_TRANSACTIONS - ledger, newest first
SELECT entry_type, amount, running_balance, currency, created_at
FROM "WALLET_LEDGER"
WHERE customer_id = CAST(:user_id AS uuid)
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
