-- PROV.CHECKLIST.BOOKING_LIST -- checklist items for a provider booking (Phase 21)
SELECT item_id, booking_id, provider_id, task_title, position,
       is_completed, completed_at, created_at
  FROM "BOOKING_CHECKLIST_ITEMS"
 WHERE provider_id = CAST(:user_id AS uuid)
   AND booking_id  = CAST(:booking_id AS uuid)
 ORDER BY position;