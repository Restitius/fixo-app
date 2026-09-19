-- CUS.DISPUTE.LIST - customer disputes with booking context
SELECT d.dispute_id, d.dispute_number, d.booking_id, b.booking_number, d.category,
       d.status, d.description, d.created_at, d.resolved_at
FROM "DISPUTES" d
JOIN "BOOKINGS" b ON b.booking_id = d.booking_id
WHERE d.customer_id = CAST(:customer_id AS uuid)
ORDER BY d.created_at DESC
LIMIT :limit OFFSET :offset;
