-- CUS.PROMOTION.USE - consume one use of a still-valid promotion
UPDATE "PROMOTIONS"
   SET used_count = used_count + 1
 WHERE promo_id = CAST(:promo_id AS uuid)
   AND active AND now() BETWEEN valid_from AND valid_until
   AND (usage_limit IS NULL OR used_count < usage_limit)
RETURNING promo_id, code, used_count, usage_limit;
