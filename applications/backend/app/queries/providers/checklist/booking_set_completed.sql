-- PROV.CHECKLIST.BOOKING_SET_COMPLETED -- provider checks a task as completed (Phase 21)
-- Guards the completion so tasks are only toggled once (completed_at stamped
-- only when transitioning to completed, never unset once done).
UPDATE "BOOKING_CHECKLIST_ITEMS"
   SET is_completed  = TRUE,
       completed_at  = CASE WHEN is_completed = FALSE THEN now()
                            ELSE completed_at END
 WHERE provider_id = CAST(:user_id AS uuid)
   AND booking_id  = CAST(:booking_id AS uuid)
   AND item_id     = CAST(:item_id AS uuid)
   AND is_completed = FALSE
RETURNING item_id, booking_id, task_title, position, is_completed, completed_at;