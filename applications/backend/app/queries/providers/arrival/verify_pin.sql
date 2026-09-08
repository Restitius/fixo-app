-- PROV.ARRIVAL.VERIFY_PIN — provider enters the customer's job PIN (Requirement Phase 19).
UPDATE "BOOKINGS"
   SET verified_at = now(),
       updated_at = now()
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid)
   AND status = 'ARRIVED'
   AND verified_at IS NULL
   AND arrival_code = :code
RETURNING booking_id, verified_at;