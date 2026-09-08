-- PRV.DASH.EARNINGS — collected (paid) and billed snapshots, per requirement window
SELECT
  COALESCE(sum(CASE WHEN i.paid_at >= date_trunc('day', now())
                    THEN i.total_amount END), 0) AS collected_today,
  COALESCE(sum(CASE WHEN i.paid_at >= date_trunc('week', now())
                    THEN i.total_amount END), 0) AS collected_week,
  COALESCE(sum(CASE WHEN i.paid_at >= date_trunc('month', now())
                    THEN i.total_amount END), 0) AS collected_month,
  COALESCE(sum(CASE WHEN i.issued_at >= date_trunc('month', now())
                    THEN i.total_amount END), 0) AS billed_month,
  COALESCE(max(i.currency), 'TZS') AS currency
  FROM "INVOICES" i
 WHERE i.provider_id = CAST(:user_id AS uuid);