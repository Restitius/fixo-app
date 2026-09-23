-- PROV.CHANGE.SUBMIT — provider submits a change request on an active booking (Phase 23)
-- Ownership + execution guard: the booking must belong to the provider and
-- work must be active (the customer still decides via CUS.CHANGE.DECIDE).
WITH changed AS (
INSERT INTO "CHANGE_REQUESTS"
       (booking_id, requested_by, change_type, current_value, proposed_value,
        reason, new_work, additional_labour, additional_materials,
        additional_time_minutes, additional_price, currency, supporting_photos)
SELECT b.booking_id,
       'PROVIDER',
       CAST(:change_type AS varchar),
       CAST(:current_value AS varchar),
       CAST(:proposed_value AS varchar),
       CAST(:reason AS varchar),
       CAST(:new_work AS varchar),
       CAST(:additional_labour AS numeric),
       CAST(:additional_materials AS numeric),
       CAST(:additional_time_minutes AS integer),
       CAST(:additional_price AS numeric),
       CAST(:currency AS varchar),
       CAST(:supporting_photos AS json)
  FROM "BOOKINGS" b
 WHERE b.booking_id  = CAST(:booking_id AS uuid)
   AND b.provider_id = CAST(:user_id AS uuid)
   AND b.status IN ('ARRIVED','STARTED','IN_PROGRESS','COMPLETION_REQUESTED')
RETURNING change_id, booking_id, requested_by, change_type, current_value,
          proposed_value, reason, new_work, additional_labour,
          additional_materials, additional_time_minutes, additional_price,
          currency, supporting_photos, status, created_at
), queued AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.CHANGE.PROPOSED.V1', 'customer', b.customer_id,
           jsonb_build_object(
               'booking_id', b.booking_id,
               'booking_number', b.booking_number,
               'change_id', changed.change_id
           )
      FROM changed
      JOIN "BOOKINGS" b ON b.booking_id = changed.booking_id
)
SELECT change_id, booking_id, requested_by, change_type, current_value,
       proposed_value, reason, new_work, additional_labour,
       additional_materials, additional_time_minutes, additional_price,
       currency, supporting_photos, status, created_at
  FROM changed;
