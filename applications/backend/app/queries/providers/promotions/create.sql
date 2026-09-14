-- PROV.PROMOTIONS.CREATE - create a provider promotion code
INSERT INTO "PROVIDER_PROMOTIONS" (
    provider_id, code, name, description, discount_type, discount_value,
    min_amount, max_discount, usage_limit, valid_from, valid_until
)
VALUES (
    CAST(:provider_id AS uuid), UPPER(:code), :name, :description, :discount_type, :discount_value,
    :min_amount, :max_discount, :usage_limit, :valid_from, :valid_until
)
RETURNING promo_id, provider_id, code, name, description, discount_type, discount_value,
          min_amount, max_discount, usage_limit, used_count, valid_from, valid_until,
          active, created_at;
