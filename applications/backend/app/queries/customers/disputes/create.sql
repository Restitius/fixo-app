-- CUS.DISPUTE.CREATE - open a dispute on an owned booking
INSERT INTO "DISPUTES" (booking_id, customer_id, category, description)
SELECT CAST(:booking_id AS uuid), CAST(:customer_id AS uuid), :category, :description
WHERE EXISTS (
    SELECT 1 FROM "BOOKINGS" b
    WHERE b.booking_id = CAST(:booking_id AS uuid)
      AND b.customer_id = CAST(:customer_id AS uuid)
)
RETURNING dispute_id, dispute_number, booking_id, category, status, created_at;
