-- CUS.HISTORY.BOOKINGS - past bookings with service/provider context
SELECT b.booking_id, b.booking_number, b.status, b.scheduled_date, b.time_window,
       b.agreed_amount, b.currency, b.created_at, b.completed_at,
       s.name AS service_name, p.display_name AS provider_name
FROM "BOOKINGS" b
LEFT JOIN "SERVICES" s ON s.service_id = b.service_id
LEFT JOIN "PROVIDERS" p ON p.provider_id = b.provider_id
WHERE b.customer_id = CAST(:user_id AS uuid)
  AND (CAST(:status AS varchar) IS NULL OR b.status = :status)
ORDER BY b.created_at DESC
LIMIT :limit OFFSET :offset;
