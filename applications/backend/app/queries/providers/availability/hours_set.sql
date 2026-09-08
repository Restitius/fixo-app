-- PRV.AVAIL.HOURS.SET — upsert one day's recurring window (0=Monday … 6=Sunday)
INSERT INTO "PROVIDER_WORKING_HOURS" (
    provider_id, day_of_week, is_available, start_time, end_time
) VALUES (
    CAST(:user_id AS uuid), :day_of_week, :is_available, :start_time, :end_time
)
ON CONFLICT (provider_id, day_of_week) DO UPDATE SET
    is_available = EXCLUDED.is_available,
    start_time   = EXCLUDED.start_time,
    end_time     = EXCLUDED.end_time,
    updated_at   = now()
RETURNING hours_id, provider_id, day_of_week, is_available,
          start_time, end_time, updated_at;