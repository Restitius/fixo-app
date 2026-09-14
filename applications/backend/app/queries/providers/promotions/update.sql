-- PROV.PROMOTIONS.UPDATE - modify a promotion's terms (ownership-scoped)
UPDATE "PROVIDER_PROMOTIONS"
SET name           = COALESCE(:name, name),
    description    = COALESCE(:description, description),
    discount_type  = COALESCE(CAST(:discount_type AS varchar), discount_type),
    discount_value = COALESCE(CAST(:discount_value AS numeric), discount_value),
    min_amount     = COALESCE(CAST(:min_amount AS numeric), min_amount),
    max_discount   = COALESCE(CAST(:max_discount AS numeric), max_discount),
    usage_limit    = COALESCE(CAST(:usage_limit AS integer), usage_limit),
    valid_from     = COALESCE(CAST(:valid_from AS timestamptz), valid_from),
    valid_until    = COALESCE(CAST(:valid_until AS timestamptz), valid_until),
    updated_at     = now()
WHERE promo_id = CAST(:promo_id AS uuid)
  AND provider_id = CAST(:user_id AS uuid)
RETURNING promo_id, code, name, description, discount_type, discount_value,
          min_amount, max_discount, usage_limit, valid_from, valid_until, updated_at;
