-- PROV.PROMOTIONS.VALIDATE - resolve a code against an order amount (ownership-scoped)
SELECT promo_id, code, name, discount_type, discount_value, min_amount, max_discount,
       usage_limit, used_count, valid_from, valid_until,
       LEAST(
         CASE WHEN discount_type = 'PERCENT'
              THEN ROUND(CAST(:amount AS numeric) * discount_value / 100, 2)
              ELSE LEAST(discount_value, CAST(:amount AS numeric))
         END,
         COALESCE(max_discount, CASE WHEN discount_type = 'PERCENT' THEN CAST(:amount AS numeric) ELSE discount_value END)
       ) AS discount_amount
FROM "PROVIDER_PROMOTIONS"
WHERE provider_id = CAST(:user_id AS uuid)
  AND code = UPPER(:code)
  AND active AND now() BETWEEN valid_from AND valid_until
  AND CAST(:amount AS numeric) >= COALESCE(min_amount, 0)
  AND (usage_limit IS NULL OR used_count < usage_limit)
LIMIT 1;
