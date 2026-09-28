-- PROV.ARRIVAL.ARRIVE — provider records arrival with GPS (Requirement Phase 19).
-- Also records the customer-visible timeline row and queues NTF.BOOKING.ARRIVED.V1.
WITH upd AS (
    UPDATE "BOOKINGS"
       SET status = 'ARRIVED',
           arrived_at = now(),
           arrival_latitude = CAST(:latitude AS numeric),
           arrival_longitude = CAST(:longitude AS numeric),
           updated_at = now()
     WHERE booking_id = CAST(:booking_id AS uuid)
       AND provider_id = CAST(:user_id AS uuid)
       AND status = 'ON_THE_WAY'
    RETURNING booking_id, booking_number, customer_id, arrived_at,
              arrival_latitude, arrival_longitude
), tl AS (
    INSERT INTO "BOOKING_TIMELINE" (booking_id, event, detail)
    SELECT booking_id, 'ARRIVED', 'Provider arrived at the property' FROM upd
), outbox AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.BOOKING.ARRIVED.V1', 'customer', customer_id,
           jsonb_build_object('booking_id', booking_id, 'booking_number', booking_number)
      FROM upd
)
SELECT booking_id, arrived_at, arrival_latitude, arrival_longitude FROM upd;
