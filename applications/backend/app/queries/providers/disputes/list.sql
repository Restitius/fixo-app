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
WHERE d.provider_id = CAST(:user_id AS uuid)
  AND (CAST(:status AS text) IS NULL OR CAST(:status AS text) = 'all' OR d.status = CAST(:status AS text))
  AND (CAST(:booking_id AS text) IS NULL OR d.booking_id = CAST(:booking_id AS uuid))
ORDER BY d.created_at DESC
LIMIT :limit OFFSET :offset;