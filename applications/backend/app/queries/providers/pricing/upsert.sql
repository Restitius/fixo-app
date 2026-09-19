-- PRV.PRICING.UPSERT — full replace of one service's structured pricing, then
-- atomically re-syncs the parent configuration's coarse pricing columns so
-- marketplace readers (pricing_model / minimum_charge / base_amount) stay true.
-- FK to PROVIDER_SERVICES guarantees only configured services can be priced.
WITH priced AS (
    INSERT INTO "PROVIDER_SERVICE_PRICING" (
        provider_id, service_id, pricing_model,
        base_amount, from_amount, hourly_rate, minimum_hours, inspection_fee,
        currency, includes_text, is_negotiable
    ) VALUES (
        CAST(:user_id AS uuid), CAST(:service_id AS uuid), :pricing_model,
        :base_amount, :from_amount, :hourly_rate, :minimum_hours, :inspection_fee,
        :currency, :includes_text, :is_negotiable
    )
    ON CONFLICT (provider_id, service_id) DO UPDATE SET
        pricing_model  = EXCLUDED.pricing_model,
        base_amount    = EXCLUDED.base_amount,
        from_amount    = EXCLUDED.from_amount,
        hourly_rate    = EXCLUDED.hourly_rate,
        minimum_hours  = EXCLUDED.minimum_hours,
        inspection_fee = EXCLUDED.inspection_fee,
        currency       = EXCLUDED.currency,
        includes_text  = EXCLUDED.includes_text,
        is_negotiable  = EXCLUDED.is_negotiable,
        updated_at     = now()
    RETURNING provider_id, service_id, pricing_model,
              base_amount, from_amount, hourly_rate,
              minimum_hours, inspection_fee
), synced AS (
    UPDATE "PROVIDER_SERVICES" ps
       SET pricing_model  = CASE priced.pricing_model
                                WHEN 'FIXED'  THEN 'FIXED'
                                WHEN 'HOURLY' THEN 'HOURLY'
                                ELSE 'QUOTED' END,
           base_amount    = CASE WHEN priced.pricing_model = 'FIXED'
                                 THEN priced.base_amount ELSE NULL END,
           minimum_charge = COALESCE(priced.base_amount, priced.from_amount,
                                     priced.hourly_rate, priced.inspection_fee),
           updated_at     = now()
     FROM priced
     WHERE ps.provider_id = priced.provider_id
       AND ps.service_id  = priced.service_id
    RETURNING ps.pricing_model AS config_pricing_model, ps.minimum_charge
)
SELECT priced.provider_id, priced.service_id, priced.pricing_model,
       priced.base_amount, priced.from_amount, priced.hourly_rate,
       priced.minimum_hours, priced.inspection_fee,
       :currency AS currency, :includes_text AS includes_text,
       :is_negotiable AS is_negotiable,
       synced.config_pricing_model, synced.minimum_charge
  FROM priced
  JOIN synced ON TRUE;