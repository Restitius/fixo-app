-- PROV.TRIP.START — provider begins travel to customer (Requirement Phase 18).
-- Only once the customer's initial payment is authorized (CONFIRMED -> PAYMENT_AUTHORIZED).
-- Also records the customer-visible timeline row and queues NTF.BOOKING.ON_THE_WAY.V1.
WITH upd AS (
    UPDATE "BOOKINGS"
       SET status = 'ON_THE_WAY',
           trip_started_at = now(),
           updated_at = now()
     WHERE booking_id = CAST(:booking_id AS uuid)
       AND provider_id = CAST(:user_id AS uuid)
       AND status = 'PAYMENT_AUTHORIZED'
    RETURNING booking_id, booking_number, customer_id, trip_started_at
), tl AS (
    INSERT INTO "BOOKING_TIMELINE" (booking_id, event, detail)
    SELECT booking_id, 'ON_THE_WAY', 'Provider is on the way' FROM upd
), outbox AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.BOOKING.ON_THE_WAY.V1', 'customer', customer_id,
           jsonb_build_object('booking_id', booking_id, 'booking_number', booking_number)
      FROM upd
)
SELECT booking_id, trip_started_at FROM upd;
