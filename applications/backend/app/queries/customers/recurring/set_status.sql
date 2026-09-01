-- CUS.RECURRING.SET_STATUS - guarded transitions: ACTIVE<->PAUSED, ->CANCELLED.
UPDATE "RECURRING_SERVICES"
   SET status = :to_state, updated_at = now()
 WHERE recurring_id = CAST(:recurring_id AS uuid)
   AND customer_id = CAST(:customer_id AS uuid)
   AND status = :from_state
RETURNING recurring_id, status;
