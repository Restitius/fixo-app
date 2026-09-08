-- PRV.AVAIL.HOURS.DELETE — reset one day (no row = day unset/unavailable)
DELETE FROM "PROVIDER_WORKING_HOURS"
 WHERE provider_id = CAST(:user_id AS uuid)
   AND day_of_week = :day_of_week
RETURNING day_of_week;