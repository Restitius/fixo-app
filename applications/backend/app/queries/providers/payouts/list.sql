-- PROV.PAYOUT.LIST — payouts of a provider, newest first (Phase 30).
SELECT p.payout_id, p.payout_number, p.method_id, p.amount, p.currency,
       p.status, p.failure_reason, p.requested_at, p.processed_at,
       p.completed_at, p.created_at,
       pm.method_type, pm.provider_name,
       COALESCE(pm.mobile_number, pm.account_number) AS destination
  FROM "PROVIDER_PAYOUTS" p
  JOIN "PROVIDER_PAYOUT_METHODS" pm ON pm.method_id = p.method_id
 WHERE p.provider_id = CAST(:user_id AS uuid)
 ORDER BY p.created_at DESC
 LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);