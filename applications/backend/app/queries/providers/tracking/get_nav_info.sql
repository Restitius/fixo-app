-- PROV.TRIP.GET_NAV_INFO — provider views customer address + trip context (Requirement Phase 18)
SELECT b.booking_id,
       b.scheduled_date,
       b.time_window,
       ca.street_address,
       ca.city,
       ca.region,
       ca.latitude AS address_latitude,
       ca.longitude AS address_longitude,
       c.full_name AS customer_name,
       c.phone AS customer_phone,
       b.current_latitude AS provider_latitude,
       b.current_longitude AS provider_longitude,
       b.eta_minutes
  FROM "BOOKINGS" b
  JOIN "CUSTOMERS" c ON c.customer_id = b.customer_id
  LEFT JOIN "CUSTOMER_ADDRESSES" ca ON ca.address_id = b.address_id
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.provider_id = CAST(:user_id AS uuid);
