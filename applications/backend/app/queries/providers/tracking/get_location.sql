-- PROV.TRIP.GET_LOCATION — customer views provider's live position (Requirement Phase 18)
SELECT b.booking_id,
       p.display_name AS provider_name,
       p.headline AS provider_headline,
       b.current_latitude,
       b.current_longitude,
       b.eta_minutes,
       b.trip_started_at
  FROM "BOOKINGS" b
  JOIN "PROVIDERS" p ON p.provider_id = b.provider_id
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.status = 'ON_THE_WAY';
