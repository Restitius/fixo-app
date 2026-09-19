-- PROV.MATERIALS.SUMMARY — material totals for a booking (Phase 24)
-- Costs may automatically be added to the final invoice (Phase 27).
SELECT currency,
       COUNT(*)            AS items,
       COALESCE(SUM(amount), 0) AS total_amount
  FROM "BOOKING_MATERIALS"
 WHERE provider_id = CAST(:user_id AS uuid)
   AND booking_id  = CAST(:booking_id AS uuid)
 GROUP BY currency;
