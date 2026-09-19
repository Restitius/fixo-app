-- PROV.PAYOUT.CANCEL — provider withdraws a REQUESTED payout (Phase 30).
-- Atomic: REQUESTED -> CANCELLED; reserved_funds released back to available;
-- one ADJUSTMENT ledger entry documents the release.
WITH payout_tx AS (
    UPDATE "PROVIDER_PAYOUTS"
       SET status = 'CANCELLED', completed_at = now()
     WHERE payout_id   = CAST(:payout_id AS uuid)
       AND provider_id = CAST(:user_id AS uuid)
       AND status      = 'REQUESTED'
    RETURNING payout_id, payout_number, provider_id, amount, currency, status
), wallet_update AS (
    UPDATE "PROVIDER_WALLETS" w
       SET reserved_funds    = w.reserved_funds - p.amount,
           available_balance = w.available_balance + p.amount,
           version           = w.version + 1,
           updated_at        = now()
      FROM payout_tx p
     WHERE w.provider_id = p.provider_id
    RETURNING w.wallet_id, w.provider_id, w.available_balance
), ledger_ins AS (
    INSERT INTO "PROVIDER_WALLET_LEDGER"
           (wallet_id, provider_id, entry_type, amount, running_balance,
            currency, reference_type, reference_id, description)
    SELECT w.wallet_id, w.provider_id, 'ADJUSTMENT',
           p.amount, w.available_balance, p.currency,
           'PAYOUT', p.payout_id,
           'Withdrawal ' || p.payout_number || ' cancelled — funds released'
      FROM payout_tx p
      JOIN wallet_update w ON w.provider_id = p.provider_id
)
SELECT p.payout_id, p.payout_number, p.amount, p.currency, p.status
  FROM payout_tx p;