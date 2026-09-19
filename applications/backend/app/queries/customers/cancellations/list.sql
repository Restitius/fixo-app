-- CUS.CANCEL.LIST - customer cancellation history
SELECT c.cancellation_id, c.booking_id, b.booking_number, c.fee_charged, c.refund_due,
       c.reason, c.requested_by, c.created_at, b.status AS booking_status
FROM "CANCELLATIONS" c
JOIN "BOOKINGS" b ON b.booking_id = c.booking_id
WHERE c.customer_id = CAST(:customer_id AS uuid)
ORDER BY c.created_at DESC
LIMIT :limit OFFSET :offset;
