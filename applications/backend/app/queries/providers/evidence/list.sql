-- PROV.EVIDENCE.LIST -- evidence items for a provider booking (Phase 22)
-- Optional filters: phase (BEFORE/DURING/AFTER), kind (PHOTO/VIDEO/...).
SELECT evidence_id, booking_id, provider_id, phase, kind, title, body,
       media_url, quantity, unit, created_at
  FROM "BOOKING_EVIDENCE"
 WHERE provider_id = CAST(:user_id AS uuid)
   AND booking_id  = CAST(:booking_id AS uuid)
   AND (CAST(:phase AS varchar) IS NULL OR phase = CAST(:phase AS varchar))
   AND (CAST(:kind AS varchar)  IS NULL OR kind  = CAST(:kind AS varchar))
 ORDER BY created_at;
