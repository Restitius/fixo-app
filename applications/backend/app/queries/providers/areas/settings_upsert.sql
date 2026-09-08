-- PRV.AREAS.SETTINGS.UPSERT — create or replace the travel/area policy
INSERT INTO "PROVIDER_AREA_SETTINGS" (
    provider_id, base_latitude, base_longitude, max_travel_km,
    travel_fee, free_travel_radius_km, currency, notes
) VALUES (
    CAST(:user_id AS uuid), :base_latitude, :base_longitude, :max_travel_km,
    :travel_fee, :free_travel_radius_km, :currency, :notes
)
ON CONFLICT (provider_id) DO UPDATE SET
    base_latitude         = EXCLUDED.base_latitude,
    base_longitude        = EXCLUDED.base_longitude,
    max_travel_km         = EXCLUDED.max_travel_km,
    travel_fee            = EXCLUDED.travel_fee,
    free_travel_radius_km = EXCLUDED.free_travel_radius_km,
    currency              = EXCLUDED.currency,
    notes                 = EXCLUDED.notes,
    updated_at            = now()
RETURNING provider_id, base_latitude, base_longitude, max_travel_km,
          travel_fee, free_travel_radius_km, currency, notes, updated_at;