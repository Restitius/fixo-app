-- CUS.BOOKING.MARK_COMPLETED — customer confirms completion (from CUSTOMER_CONFIRMED path),
-- with the NTF.SERVICE.COMPLETED.V1 outbox row written atomically.
WITH upd AS (
    UPDATE "BOOKINGS"
       SET status = 'CUSTOMER_CONFIRMED',
           completed_at = now(),
           updated_at = now()
     WHERE booking_id = CAST(:booking_id AS uuid)
       AND customer_id = CAST(:customer_id AS uuid)
       AND status = 'COMPLETION_REQUESTED'
    RETURNING booking_id, completed_at, customer_id, booking_number
), outbox_ins AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.SERVICE.COMPLETED.V1', 'customer', upd.customer_id,
           jsonb_build_object('booking_id', upd.booking_id, 'booking_number', upd.booking_number)
      FROM upd
    RETURNING outbox_id
)
SELECT upd.booking_id, upd.completed_at
  FROM upd
  LEFT JOIN (SELECT count(*) FROM outbox_ins) AS _outbox_forced ON true;
