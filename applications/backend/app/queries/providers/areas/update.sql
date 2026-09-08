-- PRV.AREAS.UPDATE — partial edit of one owned area entry (type is immutable)
UPDATE "PROVIDER_SERVICE_AREAS" SET
    label            = COALESCE(:label, label),
    country          = COALESCE(:country, country),
    region           = COALESCE(:region, region),
    city             = COALESCE(:city, city),
    district         = COALESCE(:district, district),
    ward             = COALESCE(:ward, ward),
    neighborhood     = COALESCE(:neighborhood, neighborhood),
    center_latitude  = COALESCE(:center_latitude, center_latitude),
    center_longitude = COALESCE(:center_longitude, center_longitude),
    radius_km        = COALESCE(:radius_km, radius_km),
    is_active        = COALESCE(:is_active, is_active),
    updated_at       = now()
 WHERE area_id = CAST(:area_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid)
RETURNING area_id, provider_id, area_type, label,
          country, region, city, district, ward, neighborhood,
          center_latitude, center_longitude, radius_km,
          is_active, created_at, updated_at;