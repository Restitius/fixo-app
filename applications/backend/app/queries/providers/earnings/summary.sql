-- PROV.EARNINGS.SUMMARY — provider earnings statistics (Phase 28).
-- Money arrives on INVOICES: ISSUED = pending (not yet paid), PAID = available.
-- total_earnings is all recognized revenue (ISSUED + PAID); pending_earnings
-- is only the not-yet-paid slice, distinct from total (Phase 30's payout
-- system is live, so withdrawn_amount is a real figure from the wallet
-- ledger, not the permanent stub this used to be).
-- Amounts are grouped per window (today / week / month / year) on paid_at.
SELECT
  COALESCE(SUM(CASE WHEN i.status = 'ISSUED' THEN i.total_amount END), 0)
      AS pending_earnings,
  COALESCE(SUM(CASE WHEN i.status = 'PAID' THEN i.total_amount END), 0)
      AS available_balance,
  COALESCE(SUM(CASE WHEN i.status IN ('ISSUED', 'PAID') THEN i.total_amount END), 0)
      AS total_earnings,
  COALESCE((SELECT ABS(SUM(l.amount)) FROM "PROVIDER_WALLET_LEDGER" l
             JOIN "PROVIDER_WALLETS" w ON w.wallet_id = l.wallet_id
            WHERE w.provider_id = CAST(:user_id AS uuid)
              AND l.entry_type = 'WITHDRAWAL'), 0)
      AS withdrawn_amount,
  COALESCE(SUM(CASE WHEN i.paid_at >= date_trunc('day', now())   THEN i.total_amount END), 0)
      AS earned_today,
  COALESCE(SUM(CASE WHEN i.paid_at >= date_trunc('week', now())  THEN i.total_amount END), 0)
      AS earned_week,
  COALESCE(SUM(CASE WHEN i.paid_at >= date_trunc('month', now()) THEN i.total_amount END), 0)
      AS earned_month,
  COALESCE(SUM(CASE WHEN i.paid_at >= date_trunc('year', now())  THEN i.total_amount END), 0)
      AS earned_year,
  COALESCE(MAX(i.currency), 'TZS') AS currency
  FROM "INVOICES" i
 WHERE i.provider_id = CAST(:user_id AS uuid);