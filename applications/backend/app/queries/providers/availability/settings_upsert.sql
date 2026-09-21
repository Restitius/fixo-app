-- PRV.AVAIL.SETTINGS.UPSERT — create or replace the availability toggles
INSERT INTO "PROVIDER_AVAILABILITY_SETTINGS" (
    provider_id, is_online, accepts_emergency, accepts_same_day,
    accepts_holidays, vacation_mode, vacation_from, vacation_until,
    timezone, notes
) VALUES (
    CAST(:user_id AS uuid), :is_online, :accepts_emergency, :accepts_same_day,
    :accepts_holidays, :vacation_mode, :vacation_from, :vacation_until,
    :timezone, :notes
)
ON CONFLICT (provider_id) DO UPDATE SET
    is_online         = EXCLUDED.is_online,
    accepts_emergency = EXCLUDED.accepts_emergency,
    accepts_same_day  = EXCLUDED.accepts_same_day,
    accepts_holidays  = EXCLUDED.accepts_holidays,
    vacation_mode     = EXCLUDED.vacation_mode,
    vacation_from     = EXCLUDED.vacation_from,
    vacation_until    = EXCLUDED.vacation_until,
    timezone          = EXCLUDED.timezone,
    notes             = EXCLUDED.notes,
    updated_at        = now()
RETURNING provider_id, is_online, accepts_emergency, accepts_same_day,
          accepts_holidays, vacation_mode, vacation_from, vacation_until,
          timezone, notes, updated_at;