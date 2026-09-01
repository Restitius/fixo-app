-- CUS.PROMOTION.VALIDATE - resolve a code against an order amount
SELECT promo_id, code, name, discount_type, discount_value,
       CASE WHEN discount_type = 'PERCENT'
            THEN ROUND(:amount * discount_value / 100, 2)
            ELSE LEAST(discount_value, :amount)
       END AS discount_amount
FROM "PROMOTIONS"
WHERE code = UPPER(:code)
  AND active AND now() BETWEEN valid_from AND valid_until
LIMIT 1;
