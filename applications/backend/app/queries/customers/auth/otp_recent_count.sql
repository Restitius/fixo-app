-- CUS.AUTH.OTP.RECENT_COUNT - resend rate limiting
SELECT count(*)::int AS issued,
       COALESCE(EXTRACT(EPOCH FROM (now() - max(created_at))), 1e9)::float AS seconds_since_last
  FROM "OTP_CODES"
 WHERE customer_id = CAST(:user_id AS uuid)
   AND purpose     = :purpose
   AND created_at  > now() - make_interval(secs => CAST(:window_seconds AS double precision));
