-- CUS.PAYMENT.MARK_CAPTURED — stamp the captured attempt +
-- record capture_ref; ownership via booking.
WITH owned AS (
    SELECT p.payment_id, b.booking_id
      FROM "PAYMENTS" p
      JOIN "BOOKINGS" b ON b.booking_id = p.booking_id
     WHERE p.payment_id = CAST(:payment_id AS uuid)
       AND b.customer_id = CAST(:customer_id AS uuid)
)
UPDATE "PAYMENTS" pay
   SET captured_at = now(),
       gateway_ref = COALESCE(:capture_ref, gateway_ref)
 WHERE pay.payment_id IN (SELECT payment_id FROM owned)
RETURNING pay.payment_id;