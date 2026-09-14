-- CUS.BOOKING.SET_ARRIVED — provider-side arrival (guarded from ON_THE_WAY),
-- with the NTF.BOOKING.ARRIVED.V1 outbox row written atomically.
WITH upd AS (
    UPDATE "BOOKINGS"
       SET status = 'ARRIVED',
           arrived_at = now(),
           updated_at = now()
     WHERE booking_id = CAST(:booking_id AS uuid)
       AND status = 'ON_THE_WAY'
    RETURNING booking_id, arrived_at, customer_id, booking_number
), outbox_ins AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.BOOKING.ARRIVED.V1', 'customer', upd.customer_id,
           jsonb_build_object('booking_id', upd.booking_id, 'booking_number', upd.booking_number)
      FROM upd
    RETURNING outbox_id
)
SELECT upd.booking_id, upd.arrived_at
  FROM upd
  LEFT JOIN (SELECT count(*) FROM outbox_ins) AS _outbox_forced ON true;
