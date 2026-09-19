-- Owned cancellation detail
SELECT c.*, b.booking_number
FROM   "CANCELLATIONS" c
JOIN   "BOOKINGS" b ON b.booking_id = c.booking_id
WHERE  c.cancellation_id = CAST(:cancellation_id AS uuid)
  AND  b.customer_id  = CAST(:customer_id AS uuid);
