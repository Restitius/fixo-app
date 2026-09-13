-- PROV.DISPUTE.GET - single dispute on a provider booking (ownership-scoped)
SELECT
    d.dispute_id,
    d.dispute_number,
    d.booking_id,
    b.booking_number,
    d.category,
    d.status,
    d.description,
    d.resolution,
    d.created_at,
    d.resolved_at,
    (SELECT COUNT(*) FROM "DISPUTE_EVIDENCE" e WHERE e.dispute_id = d.dispute_id) AS evidence_count
FROM "DISPUTES" d
JOIN "BOOKINGS" b ON b.booking_id = d.booking_id
WHERE d.provider_id = CAST(:provider_id AS uuid)
  AND d.dispute_id = CAST(:dispute_id AS uuid)
LIMIT 1;