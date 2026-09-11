-- PROV.WALLET.GET — get-or-create the provider's wallet row (Phase 29).
-- Returns zeros when no wallet exists yet (no money events written).
WITH wallet AS (
    SELECT w.wallet_id, w.provider_id, w.available_balance,
           w.pending_balance, w.reserved_funds, w.currency, w.created_at
      FROM "PROVIDER_WALLETS" w
     WHERE w.provider_id = CAST(:user_id AS uuid)
)
SELECT w.wallet_id, w.provider_id, w.available_balance,
       w.pending_balance, w.reserved_funds, w.currency, w.created_at
  FROM wallet w;