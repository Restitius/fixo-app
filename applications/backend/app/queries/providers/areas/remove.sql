-- PRV.AREAS.REMOVE — delete one owned area entry (config row, no history refs)
DELETE FROM "PROVIDER_SERVICE_AREAS"
 WHERE area_id = CAST(:area_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid)
RETURNING area_id;