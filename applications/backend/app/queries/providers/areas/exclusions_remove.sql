-- PRV.AREAS.EXCLUSIONS.REMOVE — delete one owned exclusion
DELETE FROM "PROVIDER_AREA_EXCLUSIONS"
 WHERE exclusion_id = CAST(:exclusion_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid)
RETURNING exclusion_id;