-- PROV.BOOKING.DETAILS -- full operational screen for a provider booking (Phase 16)
-- arrival_code deliberately excluded — see app/queries/providers/arrival/status.sql
-- for why the provider's own API must never return the customer's arrival PIN.
SELECT b.booking_id, b.booking_number, b.status, b.scheduled_date,
       b.time_window, b.agreed_amount, b.currency,
       b.payment_attempts, b.arrived_at, b.verified_at,
       b.started_at, b.completed_at, b.created_at, b.updated_at,
       c.full_name AS customer_name,
       c.phone AS customer_phone, c.email AS customer_email,
       s.name AS service_name, s.description AS service_description,
       ca.street_address, ca.city, ca.region, ca.district,
       ca.latitude, ca.longitude,
       ack.acknowledged_at, ack.notes AS ack_notes,
       r.request_number
  FROM "BOOKINGS" b
  JOIN "CUSTOMERS" c ON c.customer_id = b.customer_id
  JOIN "SERVICES" s ON s.service_id = b.service_id
  JOIN "SERVICE_REQUESTS" r ON r.request_id = b.request_id
  LEFT JOIN "CUSTOMER_ADDRESSES" ca ON ca.address_id = b.address_id
  LEFT JOIN "PROVIDER_BOOKING_ACKNOWLEDGEMENTS" ack
    ON ack.booking_id = b.booking_id
   AND ack.provider_id = CAST(:user_id AS uuid)
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.provider_id = CAST(:user_id AS uuid);
