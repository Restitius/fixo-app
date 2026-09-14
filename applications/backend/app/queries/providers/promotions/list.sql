-- PROV.PROMOTIONS.LIST - the provider's promotion codes
SELECT promo_id, code, name, description, discount_type, discount_value,
       min_amount, max_discount, usage_limit, used_count, valid_from, valid_until,
       active, created_at, updated_at
FROM "PROVIDER_PROMOTIONS"
WHERE provider_id = CAST(:user_id AS uuid)
  AND (CAST(:active AS boolean) IS NULL OR active = :active)
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
