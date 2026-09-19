-- PRV.AVAIL.SETTINGS.GET — availability toggles + vacation window (owner view)
SELECT provider_id, is_online, accepts_emergency, accepts_same_day,
       accepts_holidays, vacation_mode, vacation_from, vacation_until,
       timezone, notes, created_at, updated_at
  FROM "PROVIDER_AVAILABILITY_SETTINGS"
 WHERE provider_id = CAST(:user_id AS uuid);