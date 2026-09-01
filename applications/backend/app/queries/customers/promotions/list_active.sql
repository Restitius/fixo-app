-- CUS.PROMOTION.LIST_ACTIVE - currently running promotions
SELECT promo_id, code, name, discount_type, discount_value, valid_from, valid_until
FROM "PROMOTIONS"
WHERE active AND now() BETWEEN valid_from AND valid_until
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
