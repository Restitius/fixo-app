-- PROV.ARRIVAL.VERIFY_PIN — provider enters the customer's job PIN (Requirement Phase 19).
-- Also records the customer-visible timeline row.
WITH upd AS (
    UPDATE "BOOKINGS"
       SET verified_at = now(),
           updated_at = now()
     WHERE booking_id = CAST(:booking_id AS uuid)
       AND provider_id = CAST(:user_id AS uuid)
       AND status = 'ARRIVED'
       AND verified_at IS NULL
       AND arrival_code = :code
    RETURNING booking_id, verified_at
), tl AS (
    INSERT INTO "BOOKING_TIMELINE" (booking_id, event, detail)
    SELECT booking_id, 'ARRIVAL_VERIFIED', 'Arrival verified with your job PIN' FROM upd
)
SELECT booking_id, verified_at FROM upd;
