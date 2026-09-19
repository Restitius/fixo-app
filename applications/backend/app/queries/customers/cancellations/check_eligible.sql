-- /api/v1/cancellations eligibility probe
SELECT b.booking_id, b.booking_number, b.status, b.scheduled_start, b.agreed_amount,
       COALESCE((SELECT SUM(amount) FROM "PAYMENTS" p
                 WHERE p.booking_id = b.booking_id AND p.status = 'AUTHORIZED'), 0) AS authorized_total
FROM   "BOOKINGS" b
WHERE  b.booking_id = CAST(:booking_id AS uuid)
  AND  b.customer_id = CAST(:customer_id AS uuid);
