-- PROV.EVIDENCE.SUMMARY -- evidence counts per phase/kind for a booking (Phase 22)
SELECT phase,
       kind,
       COUNT(*) AS count
  FROM "BOOKING_EVIDENCE"
 WHERE provider_id = CAST(:user_id AS uuid)
   AND booking_id  = CAST(:booking_id AS uuid)
 GROUP BY phase, kind
 ORDER BY phase, kind;
