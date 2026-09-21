-- PROV.PROMOTIONS.GET - single owned promotion
SELECT promo_id, code, name, description, discount_type, discount_value,
       min_amount, max_discount, usage_limit, used_count, valid_from, valid_until,
       active, created_at, updated_at
FROM "PROVIDER_PROMOTIONS"
WHERE promo_id = CAST(:promo_id AS uuid)
  AND provider_id = CAST(:user_id AS uuid);
