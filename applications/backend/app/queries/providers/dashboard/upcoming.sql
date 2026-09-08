-- PRV.DASH.UPCOMING — today's schedule and the next 7 days
SELECT b.booking_id, b.booking_number, b.scheduled_date, b.time_window,
       b.status, b.agreed_amount, b.currency, s.name AS service_name
  FROM "BOOKINGS" b
  JOIN "SERVICES" s ON s.service_id = b.service_id
 WHERE b.provider_id = CAST(:user_id AS uuid)
   AND b.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
   AND b.status NOT IN ('CANCELLED', 'CLOSED')
 ORDER BY b.scheduled_date, b.time_window
 LIMIT 20;