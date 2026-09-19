-- PRV.AVAIL.TIMEOFF.ADD — one unavailable period (ends_at must be after starts_at)
INSERT INTO "PROVIDER_TIME_OFF" (provider_id, reason, starts_at, ends_at)
VALUES (CAST(:user_id AS uuid), :reason, :starts_at, :ends_at)
RETURNING time_off_id, provider_id, reason, starts_at, ends_at, created_at;