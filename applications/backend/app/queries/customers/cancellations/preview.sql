-- CUS.CANCEL.PREVIEW - booking fields needed to price a cancellation
SELECT b.booking_id,
       b.status,
       b.agreed_amount,
       b.scheduled_date,
       b.created_at
FROM "BOOKINGS" b
WHERE b.booking_id = CAST(:booking_id AS uuid)
  AND b.customer_id = CAST(:customer_id AS uuid)
LIMIT 1;
