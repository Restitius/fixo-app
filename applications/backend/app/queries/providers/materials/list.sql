-- PROV.MATERIALS.LIST — material lines for a provider booking (Phase 24)
SELECT material_id, booking_id, provider_id, item_name, quantity,
       unit_cost, amount, currency, note, attachment_url,
       attachment_kind, created_at
  FROM "BOOKING_MATERIALS"
 WHERE provider_id = CAST(:user_id AS uuid)
   AND booking_id  = CAST(:booking_id AS uuid)
 ORDER BY created_at;
