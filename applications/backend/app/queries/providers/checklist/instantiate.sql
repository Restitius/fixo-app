-- PROV.CHECKLIST.INSTANTIATE -- apply a provider's template to a booking (Phase 21)
-- Copies the active template's task titles as checklist items. Idempotent per
-- booking via the INSERT .. SELECT .. WHERE NOT EXISTS guard.
-- items is a JSON array of plain task titles, e.g. ["Inspect unit","Clean filters"].
-- The booking must actually be assigned to this provider — otherwise any
-- provider with an active template could instantiate a checklist against a
-- booking that isn't theirs (the FK on booking_id alone doesn't check that).
INSERT INTO "BOOKING_CHECKLIST_ITEMS" (booking_id, provider_id, task_title, position)
SELECT CAST(:booking_id AS uuid),
       CAST(:user_id AS uuid),
       value,
       (ord - 1)
  FROM "JOB_CHECKLIST_TEMPLATES" t
  JOIN json_array_elements_text(t.items::json) WITH ORDINALITY AS item(value, ord)
    ON 1 = 1
 WHERE t.provider_id = CAST(:user_id AS uuid)
   AND t.service_id  = CAST(:service_id AS uuid)
   AND t.is_active   = TRUE
   AND EXISTS (
         SELECT 1 FROM "BOOKINGS" b
          WHERE b.booking_id = CAST(:booking_id AS uuid)
            AND b.provider_id = CAST(:user_id AS uuid)
       )
   AND NOT EXISTS (
         SELECT 1 FROM "BOOKING_CHECKLIST_ITEMS" bci
          WHERE bci.booking_id = CAST(:booking_id AS uuid)
            AND bci.provider_id = CAST(:user_id AS uuid)
       )
 RETURNING item_id, booking_id, provider_id, task_title, position, is_completed, created_at;