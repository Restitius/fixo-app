-- PROV.BOOKING.ACK_STATUS -- check if provider acknowledged (Requirement Phase 14)
SELECT ack_id, booking_id, acknowledged_at, notes
  FROM "PROVIDER_BOOKING_ACKNOWLEDGEMENTS"
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid);
