-- CUS.CHANGE.DECIDE — guarded PROPOSED → decision with actor stamp.
UPDATE "CHANGE_REQUESTS"
   SET status = CAST(:decision AS varchar),
       decided_at = now()
 WHERE change_id = CAST(:change_id AS uuid)
   AND status = 'PROPOSED'
RETURNING change_id, booking_id, requested_by, change_type,
          proposed_value, status;