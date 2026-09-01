-- CUS.RATING.LIST_MINE — every rating this customer has submitted, newest first
SELECT r.rating_id, r.booking_id, r.provider_id, r.rating, r.comment,
       r.created_at, r.updated_at,
       b.booking_number, b.agreed_amount, b.currency, b.scheduled_date,
       p.display_name AS provider_name, s.name AS service_name
  FROM "RATINGS" r
  JOIN "BOOKINGS" b       ON b.booking_id = r.booking_id
  LEFT JOIN "PROVIDERS" p ON p.provider_id = r.provider_id
  LEFT JOIN "SERVICES" s  ON s.service_id = b.service_id
 WHERE r.customer_id = CAST(:user_id AS uuid)
 ORDER BY r.created_at DESC;
