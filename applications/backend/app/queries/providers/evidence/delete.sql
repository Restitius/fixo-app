-- PROV.EVIDENCE.DELETE -- provider removes one of its evidence items (Phase 22)
DELETE FROM "BOOKING_EVIDENCE"
 WHERE provider_id = CAST(:user_id AS uuid)
   AND evidence_id = CAST(:evidence_id AS uuid)
RETURNING evidence_id, booking_id;
