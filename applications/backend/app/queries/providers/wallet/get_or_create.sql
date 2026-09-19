-- PROV.WALLET.GET_OR_CREATE — atomic get-or-create the provider's wallet.
-- Used on first read so the wallet always exists for the provider.
WITH ins AS (
    INSERT INTO "PROVIDER_WALLETS" (provider_id)
    SELECT CAST(:user_id AS uuid)
     WHERE NOT EXISTS (SELECT 1 FROM "PROVIDER_WALLETS"
                        WHERE provider_id = CAST(:user_id AS uuid))
    RETURNING wallet_id, provider_id, available_balance, pending_balance,
              reserved_funds, currency, created_at
)
SELECT wallet_id, provider_id, available_balance, pending_balance,
       reserved_funds, currency, created_at FROM ins
UNION ALL
SELECT wallet_id, provider_id, available_balance, pending_balance,
       reserved_funds, currency, created_at
  FROM "PROVIDER_WALLETS"
 WHERE provider_id = CAST(:user_id AS uuid)
   AND NOT EXISTS (SELECT 1 FROM ins)
LIMIT 1;