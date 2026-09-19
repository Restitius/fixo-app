-- PROV.ARRIVAL.STATUS — arrival state for a provider's booking (Requirement Phase 19).
-- arrival_code is deliberately excluded: the customer hands the PIN to the
-- provider in person as proof of a genuine on-site visit. Exposing it back
-- through the provider's own API would let arrival be "verified" without
-- ever requiring that handoff, defeating the whole point of the code.
SELECT booking_id, status, arrived_at, verified_at,
       arrival_latitude, arrival_longitude
  FROM "BOOKINGS"
 WHERE booking_id = CAST(:booking_id AS uuid)
   AND provider_id = CAST(:user_id AS uuid);