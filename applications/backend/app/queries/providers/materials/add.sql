-- PROV.MATERIALS.ADD — provider records a material used on a booking (Phase 24)
-- Ownership guard: the booking must belong to the provider.
INSERT INTO "BOOKING_MATERIALS"
       (booking_id, provider_id, item_name, quantity, unit_cost, amount,
        currency, note, attachment_url, attachment_kind)
SELECT CAST(:booking_id AS uuid),
       CAST(:user_id AS uuid),
       :item_name,
       CAST(:quantity AS numeric),
       CAST(:unit_cost AS numeric),
       CAST(:amount AS numeric),
       CAST(:currency AS varchar),
       CAST(:note AS varchar),
       :attachment_url,
       CAST(:attachment_kind AS varchar)
  FROM (SELECT 1) AS one
 WHERE EXISTS (
       SELECT 1 FROM "BOOKINGS" b
        WHERE b.booking_id  = CAST(:booking_id AS uuid)
          AND b.provider_id = CAST(:user_id AS uuid))
RETURNING material_id, booking_id, provider_id, item_name, quantity,
          unit_cost, amount, currency, note, attachment_url,
          attachment_kind, created_at;
