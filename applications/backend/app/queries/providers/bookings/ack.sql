-- PROV.BOOKING.ACK -- provider acknowledges a booking (Requirement Phase 14)
-- booking_id must actually be this provider's own CONFIRMED booking — the FK
-- alone doesn't check either, and without this any authenticated provider
-- could acknowledge (or overwrite the ack notes on) another provider's
-- booking by guessing its id.
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
RETURNING ack_id, booking_id, provider_id, acknowledged_at, notes;
