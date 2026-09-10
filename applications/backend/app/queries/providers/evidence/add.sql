-- PROV.EVIDENCE.ADD -- provider attaches an evidence item to a booking (Phase 22)
-- Ownership guard: the booking must belong to the provider.
INSERT INTO "BOOKING_EVIDENCE"
       (booking_id, provider_id, phase, kind, title, body, media_url, quantity, unit)
SELECT CAST(:booking_id AS uuid),
       CAST(:user_id AS uuid),
       :phase,
       :kind,
       :title,
       :body,
       :media_url,
       CAST(:quantity AS numeric),
       :unit
  FROM (SELECT 1) AS one
 WHERE EXISTS (
       SELECT 1 FROM "BOOKINGS" b
        WHERE b.booking_id  = CAST(:booking_id AS uuid)
          AND b.provider_id = CAST(:user_id AS uuid))
RETURNING evidence_id, booking_id, provider_id, phase, kind, title, body,
          media_url, quantity, unit, created_at;
