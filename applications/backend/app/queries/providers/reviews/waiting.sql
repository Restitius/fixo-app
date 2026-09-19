-- PROV.REVIEW.WAITING — provider's bookings still awaiting sign-off
-- beyond the silent-effectiveness window (> 24h in COMPLETION_REQUESTED).
-- The triage list that lets the provider follow up before the approval
-- silently becomes ineffective.
SELECT b.booking_id,
       b.booking_number,
       b.customer_id,
       b.status,
       b.updated_at   AS status_updated_at,
       (EXTRACT(EPOCH FROM (now() - b.updated_at)) / 3600)::numeric(6,2)
           AS hours_since_completion_requested
  FROM "BOOKINGS" b
 WHERE b.provider_id = CAST(:user_id AS uuid)
   AND b.status      = 'COMPLETION_REQUESTED'
   AND b.updated_at < now() - interval '24 hours'
 ORDER BY b.updated_at ASC;
