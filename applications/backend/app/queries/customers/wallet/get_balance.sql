-- CUS.WALLET.GET_BALANCE
SELECT balance, currency, updated_at
FROM "WALLETS"
WHERE customer_id = CAST(:user_id AS uuid)
LIMIT 1;
