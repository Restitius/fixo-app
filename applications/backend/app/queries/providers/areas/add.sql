-- PRV.AREAS.ADD — one service-area entry (LOCATION or RADIUS)
INSERT INTO "PROVIDER_SERVICE_AREAS" (
    provider_id, area_type, label,
    country, region, city, district, ward, neighborhood,
    center_latitude, center_longitude, radius_km, is_active
) VALUES (
    CAST(:user_id AS uuid), :area_type, :label,
    :country, :region, :city, :district, :ward, :neighborhood,
    :center_latitude, :center_longitude, :radius_km, :is_active
)
RETURNING area_id, provider_id, area_type, label,
          country, region, city, district, ward, neighborhood,
          center_latitude, center_longitude, radius_km,
          is_active, created_at, updated_at;