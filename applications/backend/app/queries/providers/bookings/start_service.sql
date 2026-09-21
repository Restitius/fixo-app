-- PROV.BOOKING.START_SERVICE -- provider starts the service (Requirement Phase 20).
-- Guarded from ARRIVED (arrival verified) — the provider has confirmed they are
-- on site before work begins. Records actual start time; for hourly jobs the
-- job timer begins automatically via timer_started_at. Optional GPS snapshot
-- records where the service started.
UPDATE "BOOKINGS"
   SET status            = 'IN_PROGRESS',
       started_at        = now(),
       timer_started_at  = CASE
                             WHEN ps.pricing_model = 'HOURLY' THEN now()
                             ELSE timer_started_at
                           END,
       current_latitude  = CASE WHEN :gps_lat IS NOT NULL THEN CAST(:gps_lat AS numeric)
                                ELSE current_latitude END,
       current_longitude = CASE WHEN :gps_lng IS NOT NULL THEN CAST(:gps_lng AS numeric)
                                ELSE current_longitude END,
       updated_at        = now()
  FROM "PROVIDER_SERVICES" ps
 WHERE "BOOKINGS".booking_id = CAST(:booking_id AS uuid)
   AND "BOOKINGS".provider_id = CAST(:user_id AS uuid)
   AND "BOOKINGS".service_id = ps.service_id
   AND ps.provider_id = CAST(:user_id AS uuid)
   AND "BOOKINGS".status = 'ARRIVED'
RETURNING "BOOKINGS".booking_id, "BOOKINGS".status, "BOOKINGS".started_at,
          "BOOKINGS".timer_started_at, "BOOKINGS".current_latitude,
          "BOOKINGS".current_longitude, "BOOKINGS".updated_at;
