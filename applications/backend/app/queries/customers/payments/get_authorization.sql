-- CUS.PAYMENT.GET_AUTHORIZATION — fetch the live authorization ref for capture.
SELECT p.payment_id, p.gateway_ref
  FROM "PAYMENTS" p
 WHERE p.booking_id = CAST(:booking_id AS uuid)
   AND p.status = 'AUTHORIZED'
   AND p.captured_at IS NULL
   AND EXISTS (
       SELECT 1 FROM "BOOKINGS" b
        WHERE b.booking_id = p.booking_id
          AND b.customer_id = CAST(:customer_id AS uuid)
   )
 ORDER BY p.attempt_no DESC
 LIMIT 1;