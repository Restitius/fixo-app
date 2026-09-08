-- PRV.PRICING.CLEAR — remove a service's structured pricing and reset the
-- parent configuration to quote-based (coarse columns become NULL/QUOTED).
WITH cleared AS (
    DELETE FROM "PROVIDER_SERVICE_PRICING"
     WHERE provider_id = CAST(:user_id AS uuid)
       AND service_id  = CAST(:service_id AS uuid)
    RETURNING provider_id, service_id
), synced AS (
    UPDATE "PROVIDER_SERVICES" ps
       SET pricing_model  = 'QUOTED',
           base_amount    = NULL,
           minimum_charge = NULL,
           updated_at     = now()
     WHERE ps.provider_id = (SELECT provider_id FROM cleared)
       AND ps.service_id  = (SELECT service_id FROM cleared)
    RETURNING ps.provider_id, ps.service_id, ps.pricing_model, ps.minimum_charge
)
SELECT synced.provider_id, synced.service_id,
       synced.pricing_model, synced.minimum_charge
  FROM synced;