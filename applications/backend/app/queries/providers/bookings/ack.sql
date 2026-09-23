-- PROV.BOOKING.ACK -- provider acknowledges a booking (Requirement Phase 14)
-- booking_id must actually be this provider's own CONFIRMED booking — the FK
-- alone doesn't check either, and without this any authenticated provider
-- could acknowledge (or overwrite the ack notes on) another provider's
-- booking by guessing its id.
WITH acknowledged AS (
INSERT INTO "PROVIDER_BOOKING_ACKNOWLEDGEMENTS" (booking_id, provider_id, notes)
SELECT CAST(:booking_id AS uuid), CAST(:user_id AS uuid), :notes
 WHERE EXISTS (
    SELECT 1 FROM "BOOKINGS" b
     WHERE b.booking_id = CAST(:booking_id AS uuid)
       AND b.provider_id = CAST(:user_id AS uuid)
       AND b.status = 'CONFIRMED'
 )
ON CONFLICT (booking_id, provider_id) DO UPDATE
   SET acknowledged_at = now(),
       notes = EXCLUDED.notes
RETURNING ack_id, booking_id, provider_id, acknowledged_at, notes
), queued AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.BOOKING.ACKNOWLEDGED.V1', 'customer', b.customer_id,
           jsonb_build_object('booking_id', b.booking_id, 'booking_number', b.booking_number)
      FROM acknowledged
      JOIN "BOOKINGS" b ON b.booking_id = acknowledged.booking_id
)
SELECT ack_id, booking_id, provider_id, acknowledged_at, notes FROM acknowledged;
