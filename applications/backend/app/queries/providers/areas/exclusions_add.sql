-- PRV.AREAS.EXCLUSIONS.ADD — one excluded area (needs a label or a location part)
INSERT INTO "PROVIDER_AREA_EXCLUSIONS" (
    provider_id, label, country, region, city, district, ward, neighborhood
) VALUES (
    CAST(:user_id AS uuid), :label, :country, :region, :city,
    :district, :ward, :neighborhood
)
RETURNING exclusion_id, provider_id, label,
          country, region, city, district, ward, neighborhood, created_at;