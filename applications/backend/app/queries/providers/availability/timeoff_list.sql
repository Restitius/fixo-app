-- PRV.AVAIL.TIMEOFF.LIST — temporary unavailable periods (owner view)
SELECT time_off_id, provider_id, reason, starts_at, ends_at, created_at
  FROM "PROVIDER_TIME_OFF"
 WHERE provider_id = CAST(:user_id AS uuid)
 ORDER BY starts_at;