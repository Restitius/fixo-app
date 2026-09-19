-- PROV.PROMOTIONS.DEACTIVATE - turn off a promotion (ownership-scoped)
UPDATE "PROVIDER_PROMOTIONS"
SET active = false,
    updated_at = now()
WHERE promo_id = CAST(:promo_id AS uuid)
  AND provider_id = CAST(:user_id AS uuid)
  AND active = true
RETURNING promo_id, active, updated_at;
