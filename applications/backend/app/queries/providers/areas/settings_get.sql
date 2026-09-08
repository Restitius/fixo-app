-- PRV.AREAS.SETTINGS.GET — travel policy + base location (owner view)
SELECT provider_id, base_latitude, base_longitude, max_travel_km,
       travel_fee, free_travel_radius_km, currency, notes,
       created_at, updated_at
  FROM "PROVIDER_AREA_SETTINGS"
 WHERE provider_id = CAST(:user_id AS uuid);