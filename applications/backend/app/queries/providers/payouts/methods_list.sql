-- PROV.PAYOUT.METHODS.LIST — payout methods of a provider (Phase 30).
SELECT method_id, method_type, provider_name, account_holder,
       account_number, mobile_number, currency, is_default, created_at
  FROM "PROVIDER_PAYOUT_METHODS"
 WHERE provider_id = CAST(:user_id AS uuid)
 ORDER BY is_default DESC, created_at;