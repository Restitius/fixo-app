-- PROV.PAYOUT.METHODS.SET_DEFAULT — set a provider method as default (Phase 30).
WITH clear AS (
    UPDATE "PROVIDER_PAYOUT_METHODS"
       SET is_default = FALSE, updated_at = now()
     WHERE provider_id = CAST(:user_id AS uuid)
       AND is_default = TRUE
    RETURNING 1
)
UPDATE "PROVIDER_PAYOUT_METHODS"
   SET is_default = TRUE, updated_at = now()
 WHERE provider_id = CAST(:user_id AS uuid)
   AND method_id   = CAST(:method_id AS uuid)
RETURNING method_id, is_default;