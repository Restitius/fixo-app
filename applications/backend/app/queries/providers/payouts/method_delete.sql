-- PROV.PAYOUT.METHODS.DELETE — remove a payout method of the provider (Phase 30).
DELETE FROM "PROVIDER_PAYOUT_METHODS"
 WHERE provider_id = CAST(:user_id AS uuid)
   AND method_id   = CAST(:method_id AS uuid)
RETURNING method_id;