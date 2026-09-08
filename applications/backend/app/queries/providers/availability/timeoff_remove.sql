-- PRV.AVAIL.TIMEOFF.REMOVE — delete one owned unavailable period
DELETE FROM "PROVIDER_TIME_OFF"
 WHERE time_off_id = CAST(:time_off_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid)
RETURNING time_off_id;