-- CUS.CHANGE.DECIDE — guarded PROPOSED → decision with actor stamp.
WITH changed AS (
    UPDATE "CHANGE_REQUESTS"
       SET status = CAST(:decision AS varchar), decided_at = now()
     WHERE change_id = CAST(:change_id AS uuid)
       AND status = 'PROPOSED'
    RETURNING change_id, booking_id, requested_by, change_type, proposed_value, status
), queued AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT CASE changed.status
               WHEN 'APPROVED' THEN 'NTF.CHANGE.APPROVED.V1'
               WHEN 'REJECTED' THEN 'NTF.CHANGE.REJECTED.V1'
           END,
           'provider', b.provider_id,
           jsonb_build_object(
               'booking_id', b.booking_id,
               'booking_number', b.booking_number,
               'change_id', changed.change_id
           )
      FROM changed
      JOIN "BOOKINGS" b ON b.booking_id = changed.booking_id
     WHERE changed.status IN ('APPROVED', 'REJECTED')
       AND b.provider_id IS NOT NULL
)
SELECT change_id, booking_id, requested_by, change_type, proposed_value, status
  FROM changed;
