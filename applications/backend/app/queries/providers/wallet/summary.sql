-- PROV.WALLET.SUMMARY — the seven displayed wallet statistics (Phase 29).
-- Aggregates the immutable ledger; the wallet row carries the running
-- balances. No wallet row yet -> all zeros, currency TZS.
SELECT COALESCE(w.available_balance, 0)               AS available_balance,
       COALESCE(w.pending_balance, 0)                 AS pending_balance,
       COALESCE(w.reserved_funds, 0)                  AS reserved_funds,
       COALESCE(w.currency, 'TZS')                    AS currency,
       COALESCE((SELECT SUM(l.amount) FROM "PROVIDER_WALLET_LEDGER" l
                  WHERE l.wallet_id = w.wallet_id
                    AND l.entry_type = 'WITHDRAWAL'), 0)      AS withdrawals,
       COALESCE((SELECT SUM(l.amount) FROM "PROVIDER_WALLET_LEDGER" l
                  WHERE l.wallet_id = w.wallet_id
                    AND l.entry_type = 'REFUND_DEDUCTION'), 0) AS refund_deductions,
       COALESCE((SELECT SUM(l.amount) FROM "PROVIDER_WALLET_LEDGER" l
                  WHERE l.wallet_id = w.wallet_id
                    AND l.entry_type = 'BONUS'), 0)           AS bonuses,
       COALESCE((SELECT SUM(l.amount) FROM "PROVIDER_WALLET_LEDGER" l
                  WHERE l.wallet_id = w.wallet_id
                    AND l.entry_type = 'ADJUSTMENT'), 0)      AS adjustments
  FROM "PROVIDER_WALLETS" w
 WHERE w.provider_id = CAST(:user_id AS uuid);