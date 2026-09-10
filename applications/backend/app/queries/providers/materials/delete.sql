-- PROV.MATERIALS.DELETE — provider removes one of its material lines (Phase 24)
DELETE FROM "BOOKING_MATERIALS"
 WHERE provider_id  = CAST(:user_id AS uuid)
   AND material_id  = CAST(:material_id AS uuid)
RETURNING material_id, booking_id;
