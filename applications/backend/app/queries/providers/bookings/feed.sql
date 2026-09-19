-- PROV.BOOKING.FEED -- provider's booking list (Requirement Phase 14)
SELECT b.booking_id, b.booking_number, b.status, b.scheduled_date,
       b.time_window, b.agreed_amount, b.currency,
       b.payment_attempts, b.created_at, b.updated_at,
       b.customer_id,
       c.full_name AS customer_name,
       c.phone AS customer_phone, c.email AS customer_email,
       s.name AS service_name,
       ca.street_address, ca.city, ca.region,
       ack.acknowledged_at
  FROM "BOOKINGS" b
  JOIN "CUSTOMERS" c ON c.customer_id = b.customer_id
  JOIN "SERVICES" s ON s.service_id = b.service_id
  LEFT JOIN "CUSTOMER_ADDRESSES" ca ON ca.address_id = b.address_id
  LEFT JOIN "PROVIDER_BOOKING_ACKNOWLEDGEMENTS" ack
    ON ack.booking_id = b.booking_id
   AND ack.provider_id = CAST(:user_id AS uuid)
 WHERE b.provider_id = CAST(:user_id AS uuid)
 ORDER BY b.created_at DESC
 LIMIT :limit OFFSET :offset;
