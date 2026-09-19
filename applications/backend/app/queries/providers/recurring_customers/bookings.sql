-- PROV.RECURRING_CUSTOMERS.BOOKINGS - a customer's completed booking history with this provider
SELECT b.booking_id, b.booking_number, b.service_id, s.name AS service_name,
       b.agreed_amount, b.currency, b.scheduled_date, b.completed_at
FROM "BOOKINGS" b
JOIN "SERVICES" s ON s.service_id = b.service_id
WHERE b.provider_id = CAST(:user_id AS uuid)
  AND b.customer_id = CAST(:customer_id AS uuid)
  AND b.status = 'CLOSED'
ORDER BY b.completed_at DESC
LIMIT :limit OFFSET :offset;
