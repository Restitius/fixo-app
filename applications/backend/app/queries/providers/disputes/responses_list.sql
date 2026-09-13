-- PROV.DISPUTE.RESPONSES.LIST - provider responses for a dispute on their booking
SELECT
    r.response_id,
    r.dispute_id,
    r.kind,
    r.body,
    r.created_at,
    r.updated_at
FROM "PROVIDER_DISPUTE_RESPONSES" r
JOIN "DISPUTES" d ON d.dispute_id = r.dispute_id
JOIN "BOOKINGS" b ON b.booking_id = d.booking_id
WHERE r.dispute_id = CAST(:dispute_id AS uuid)
  AND b.provider_id = CAST(:user_id AS uuid)
ORDER BY r.created_at ASC;