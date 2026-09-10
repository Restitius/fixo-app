-- PROV.CHANGE.WITHDRAW — provider retires its own PROPOSED request (Phase 23)
-- Guarded transition: only the proposing provider can withdraw, only while
-- PROPOSED; the row is kept for audit (status → WITHDRAWN, decided_at stamped).
UPDATE "CHANGE_REQUESTS" c
   SET status     = 'WITHDRAWN',
       decided_at = now()
 WHERE c.change_id  = CAST(:change_id AS uuid)
   AND c.requested_by = 'PROVIDER'
   AND c.status     = 'PROPOSED'
   AND EXISTS (
       SELECT 1 FROM "BOOKINGS" b
        WHERE b.booking_id  = c.booking_id
          AND b.provider_id = CAST(:user_id AS uuid))
RETURNING c.change_id, c.booking_id, c.change_type, c.proposed_value,
          c.status, c.decided_at;
