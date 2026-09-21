-- PRV.AVAIL.SUMMARY — effective availability snapshot (dashboard/matching input)
SELECT s.is_online, s.accepts_emergency, s.accepts_same_day, s.accepts_holidays,
       s.vacation_mode, s.vacation_from, s.vacation_until, s.timezone,
       (SELECT count(*) FROM "PROVIDER_WORKING_HOURS" h
         WHERE h.provider_id = s.provider_id AND h.is_available) AS available_days,
       EXISTS (
           SELECT 1 FROM "PROVIDER_TIME_OFF" t
            WHERE t.provider_id = s.provider_id
              AND now() >= t.starts_at AND now() < t.ends_at
       ) AS currently_on_time_off
  FROM "PROVIDER_AVAILABILITY_SETTINGS" s
 WHERE s.provider_id = CAST(:user_id AS uuid);