-- PROV.CHECKLIST.BOOKING_PROGRESS -- completion summary for a provider booking (Phase 21)
SELECT bci.booking_id,
       COUNT(*)                                   AS total_items,
       COUNT(*) FILTER (WHERE bci.is_completed)   AS completed_items,
       COALESCE(round(
           (COUNT(*) FILTER (WHERE bci.is_completed)::numeric
              / NULLIF(COUNT(*), 0)) * 100, 1), 0) AS pct
  FROM "BOOKING_CHECKLIST_ITEMS" bci
 WHERE bci.provider_id = CAST(:user_id AS uuid)
   AND bci.booking_id  = CAST(:booking_id AS uuid)
 GROUP BY bci.booking_id;