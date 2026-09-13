-- PROV.DISPUTE.LIST - provider disputes on their bookings, newest first
-- Filters: status (all|open|under_review|resolved|withdrawn), booking
SELECT
    d.dispute_id,
    d.dispute_number,
    d.booking_id,
    b.booking_number,
    d.category,
    d.status,
    d.description,
    d.created_at,
    d.resolved_at
FROM "DISPUTES" d
JOIN "BOOKINGS" b ON b.booking_id = d.booking_id
WHERE d.provider_id = CAST(:provider_id AS uuid)
  AND (:status::text IS NULL OR :status::text = 'all' OR d.status = :status::text)
  AND (:booking_id::text IS NULL OR d.booking_id = CAST(:booking_id AS uuid))
ORDER BY d.created_at DESC
LIMIT :limit OFFSET :offset;