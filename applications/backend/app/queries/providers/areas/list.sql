-- PRV.AREAS.LIST — all service-area entries (owner view)
SELECT area_id, provider_id, area_type, label,
       country, region, city, district, ward, neighborhood,
       center_latitude, center_longitude, radius_km,
       is_active, created_at, updated_at
  FROM "PROVIDER_SERVICE_AREAS"
 WHERE provider_id = CAST(:user_id AS uuid)
 ORDER BY area_type, label, created_at;