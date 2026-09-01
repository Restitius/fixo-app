-- CUS.PROMOTION.VALIDATE - resolve a code against an order amount
SELECT promo_id, code, name, description, discount_type, discount_value,
       min_amount, max_discount, usage_limit, used_count, valid_from, valid_until,
       LEAST(
         CASE WHEN discount_type = 'PERCENT'
              THEN ROUND(:amount * discount_value / 100, 2)
              ELSE LEAST(discount_value, :amount)
         END,
         COALESCE(max_discount, CASE WHEN discount_type = 'PERCENT' THEN :amount ELSE discount_value END)
       ) AS discount_amount
FROM "PROMOTIONS"
WHERE code = UPPER(:code)
  AND active AND now() BETWEEN valid_from AND valid_until
  AND :amount >= COALESCE(min_amount, 0)
  AND (usage_limit IS NULL OR used_count < usage_limit)
LIMIT 1;
