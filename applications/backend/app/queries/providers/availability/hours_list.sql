-- PRV.AVAIL.HOURS.LIST — the weekly recurring schedule (owner view)
SELECT hours_id, provider_id, day_of_week, is_available,
       start_time, end_time, created_at, updated_at
  FROM "PROVIDER_WORKING_HOURS"
 WHERE provider_id = CAST(:user_id AS uuid)
 ORDER BY day_of_week;