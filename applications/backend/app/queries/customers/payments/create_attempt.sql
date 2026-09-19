-- CUS.PAYMENT.CREATE_ATTEMPT — open an INITIATED attempt for the booking.
INSERT INTO "PAYMENTS" (booking_id, attempt_no, amount, currency, gateway, status)
SELECT b.booking_id,
       b.payment_attempts + 1,
       b.agreed_amount, b.currency, CAST(:gateway AS varchar),
       'INITIATED'
  FROM "BOOKINGS" b
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.customer_id = CAST(:customer_id AS uuid)
RETURNING payment_id, attempt_no;