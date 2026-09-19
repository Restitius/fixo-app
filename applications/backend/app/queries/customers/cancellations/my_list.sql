-- Cancellation history for one customer
SELECT c.cancellation_id, c.booking_id, b.booking_number, c.requested_by, c.reason,
       c.policy_tier, c.fee_amount, c.refund_amount, c.created_at
FROM   "CANCELLATIONS" c
JOIN   "BOOKINGS" b ON b.booking_id = c.booking_id
WHERE  b.customer_id = CAST(:customer_id AS uuid)
ORDER BY c.created_at DESC
LIMIT  100;
