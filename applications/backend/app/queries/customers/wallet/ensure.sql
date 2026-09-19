-- CUS.WALLET.ENSURE - create the wallet row when absent (idempotent)
INSERT INTO "WALLETS" (customer_id)
SELECT CAST(:user_id AS uuid)
WHERE NOT EXISTS (SELECT 1 FROM "WALLETS" WHERE customer_id = CAST(:user_id AS uuid))
RETURNING wallet_id, balance, currency;
