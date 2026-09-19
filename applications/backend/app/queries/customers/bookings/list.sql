-- CUS.BOOKING.LIST — customer bookings, newest first, optional status filter.
SELECT b.booking_id, b.booking_number, b.status, b.agreed_amount, b.currency,
       b.scheduled_date, b.time_window, b.created_at,
       s.name AS service_name,
       p.display_name AS provider_name
  FROM "BOOKINGS" b
  JOIN "SERVICES" s  ON s.service_id = b.service_id
  JOIN "PROVIDERS" p ON p.provider_id = b.provider_id
 WHERE b.customer_id = CAST(:customer_id AS uuid)
   AND (CAST(:status AS varchar) IS NULL OR b.status = :status)
 ORDER BY b.created_at DESC
 LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);