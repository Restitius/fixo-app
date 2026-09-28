-- CUS.BOOKING.RESCHEDULE
-- Moves an owned, not-yet-started booking to a new day / time window. The guards live
-- here so two concurrent requests cannot exceed the limit; the timeline row and the
-- provider notification are written in the same statement.
WITH target AS (
    SELECT b.booking_id, b.scheduled_date AS old_date, b.time_window AS old_window
      FROM "BOOKINGS" b
     WHERE b.booking_id = CAST(:booking_id AS uuid)
       AND b.customer_id = CAST(:customer_id AS uuid)
       AND b.status IN ('CONFIRMED', 'PAYMENT_AUTHORIZED')
       AND b.reschedule_count < CAST(:max_reschedules AS integer)
       FOR UPDATE
), changed AS (
    UPDATE "BOOKINGS" b
       SET scheduled_date = CAST(:scheduled_date AS date),
           time_window = CAST(:time_window AS varchar),
           reschedule_count = b.reschedule_count + 1,
           updated_at = now()
      FROM target t
     WHERE b.booking_id = t.booking_id
    RETURNING b.booking_id, b.booking_number, b.provider_id, b.scheduled_date,
              b.time_window, b.reschedule_count
), logged AS (
    INSERT INTO "BOOKING_TIMELINE" (booking_id, event, detail)
    SELECT c.booking_id, 'RESCHEDULED', CAST(:detail AS text) FROM changed c
), queued AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.BOOKING.RESCHEDULED.V1', 'provider', c.provider_id,
           jsonb_build_object(
               'booking_id', c.booking_id,
               'booking_number', c.booking_number,
               'new_date', c.scheduled_date,
               'time_window', c.time_window
           )
      FROM changed c
)
SELECT c.booking_id, c.booking_number, c.scheduled_date, c.time_window, c.reschedule_count,
       t.old_date, t.old_window
  FROM changed c JOIN target t ON t.booking_id = c.booking_id;
