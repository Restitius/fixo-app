-- PRV.AREAS.EXCLUSIONS.LIST — areas this provider does not serve
SELECT exclusion_id, provider_id, label,
       country, region, city, district, ward, neighborhood, created_at
  FROM "PROVIDER_AREA_EXCLUSIONS"
 WHERE provider_id = CAST(:user_id AS uuid)
 ORDER BY label, created_at;