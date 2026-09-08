-- PRV.PRICING.GET — one service's structured pricing (owner view)
SELECT p.pricing_id, p.provider_id, p.service_id,
       s.slug AS service_code,
       COALESCE(ps.display_name, s.name) AS service_name,
       ps.status AS config_status,
       p.pricing_model, p.base_amount, p.from_amount, p.hourly_rate,
       p.minimum_hours, p.inspection_fee, p.currency, p.includes_text,
       p.is_negotiable, p.created_at, p.updated_at
  FROM "PROVIDER_SERVICE_PRICING" p
  JOIN "SERVICES" s
    ON s.service_id = p.service_id
  LEFT JOIN "PROVIDER_SERVICES" ps
    ON ps.provider_id = p.provider_id AND ps.service_id = p.service_id
 WHERE p.provider_id = CAST(:user_id AS uuid)
   AND p.service_id  = CAST(:service_id AS uuid);