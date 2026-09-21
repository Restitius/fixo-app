-- CUS.BOOKING.GET — owned booking with full context.
SELECT b.booking_id, b.booking_number, b.status, b.agreed_amount, b.currency,
       b.scheduled_date, b.time_window, b.payment_attempts,
       b.arrival_code, b.arrived_at, b.verified_at,
       b.started_at, b.completed_at,
       r.selected_provider_id, b.created_at, b.updated_at,
       r.request_number,
       s.name AS service_name, s.slug AS service_slug,
       p.display_name AS provider_name, p.headline AS provider_headline,
       a.label AS address_label, a.street_address AS address_street,
       a.city AS address_city
  FROM "BOOKINGS" b
  JOIN "SERVICE_REQUESTS" r ON r.request_id = b.request_id
  JOIN "SERVICES" s        ON s.service_id = b.service_id
  JOIN "PROVIDERS" p       ON p.provider_id = b.provider_id
  LEFT JOIN "CUSTOMER_ADDRESSES" a ON a.address_id = b.address_id
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.customer_id = CAST(:customer_id AS uuid);