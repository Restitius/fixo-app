-- PROV.BOOKING.ACK -- provider acknowledges a booking (Requirement Phase 14)
INSERT INTO "PROVIDER_BOOKING_ACKNOWLEDGEMENTS" (booking_id, provider_id, notes)
VALUES (CAST(:booking_id AS uuid), CAST(:user_id AS uuid), :notes)
ON CONFLICT (booking_id, provider_id) DO UPDATE
   SET acknowledged_at = now(),
       notes = EXCLUDED.notes
RETURNING ack_id, booking_id, provider_id, acknowledged_at, notes;
