-- PROV.PAYOUT.GET — one payout of a provider (Phase 30).
SELECT p.payout_id, p.payout_number, p.method_id, p.amount, p.currency,
       p.status, p.failure_reason, p.requested_at, p.processed_at,
       p.completed_at, p.created_at,
       pm.method_type, pm.provider_name,
       COALESCE(pm.mobile_number, pm.account_number) AS destination
  FROM "PROVIDER_PAYOUTS" p
  JOIN "PROVIDER_PAYOUT_METHODS" pm
    ON pm.method_id = p.method_id AND pm.provider_id = p.provider_id
 WHERE p.payout_id   = CAST(:payout_id AS uuid)
   AND p.provider_id = CAST(:user_id AS uuid);