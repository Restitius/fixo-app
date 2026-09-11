-- PROV.EARNINGS.SUMMARY — provider earnings statistics (Phase 28).
-- Money arrives on INVOICES: DRAFT/ISSUED = pending, PAID = available.
-- Withdrawn = 0 until the payout system (Phase 30) is live.
-- Amounts are grouped per window (today / week / month / year) on paid_at.
SELECT
  COALESCE(SUM(CASE WHEN i.status IN ('ISSUED', 'PAID') THEN i.total_amount END), 0)
      AS pending_earnings,
  COALESCE(SUM(CASE WHEN i.status = 'PAID' THEN i.total_amount END), 0)
      AS available_balance,
  COALESCE(SUM(CASE WHEN i.status IN ('ISSUED', 'PAID') THEN i.total_amount END), 0)
      AS total_earnings,
  0 AS withdrawn_amount,
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