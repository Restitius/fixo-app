-- PROV.PAYOUT.WITHDRAW — request a withdrawal from the provider wallet (Phase 30).
-- Atomic: creates the REQUESTED payout, moves available_balance -> reserved_funds
-- on the wallet (guarded: sufficient available balance + method_id actually
-- belongs to this provider, so the wallet debit itself fails closed on a
-- foreign method_id rather than committing before payout_ins would reject it),
-- and writes one WITHDRAWAL ledger entry. All-or-nothing in a single statement.
WITH wallet_update AS (
    UPDATE "PROVIDER_WALLETS"
       SET available_balance = available_balance - CAST(:amount AS numeric),
           reserved_funds    = reserved_funds    + CAST(:amount AS numeric),
           version           = version + 1,
           updated_at        = now()
     WHERE provider_id = CAST(:user_id AS uuid)
       AND available_balance >= CAST(:amount AS numeric)
       AND EXISTS (
             SELECT 1 FROM "PROVIDER_PAYOUT_METHODS" pm
              WHERE pm.method_id = CAST(:method_id AS uuid)
                AND pm.provider_id = CAST(:user_id AS uuid)
           )
     RETURNING wallet_id, provider_id, available_balance
), payout_ins AS (
    INSERT INTO "PROVIDER_PAYOUTS"
           (payout_number, provider_id, method_id, amount, currency, status)
    SELECT 'PYT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
           w.provider_id, CAST(:method_id AS uuid), CAST(:amount AS numeric),
           CAST(COALESCE(:currency, 'TZS') AS varchar), 'REQUESTED'
      FROM wallet_update w
    RETURNING payout_id, payout_number, provider_id, method_id,
              amount, currency, status, requested_at
), ledger_ins AS (
    INSERT INTO "PROVIDER_WALLET_LEDGER"
           (wallet_id, provider_id, entry_type, amount, running_balance,
            currency, reference_type, reference_id, description)
    SELECT w.wallet_id, w.provider_id, 'WITHDRAWAL',
           -CAST(:amount AS numeric), w.available_balance,
           CAST(COALESCE(:currency, 'TZS') AS varchar),
           'PAYOUT', p.payout_id,
           'Withdrawal ' || p.payout_number || ' requested'
      FROM wallet_update w
      JOIN payout_ins p ON p.provider_id = w.provider_id
    RETURNING entry_id
)
SELECT p.payout_id, p.payout_number, p.provider_id, p.method_id,
       p.amount, p.currency, p.status, p.requested_at
  FROM payout_ins p;