-- PROV.DISPUTE.EVIDENCE.LIST - evidence on a dispute, ownership via provider
SELECT
    e.evidence_id,
    e.kind,
    e.url,
    e.note,
    e.created_at
FROM "DISPUTE_EVIDENCE" e
JOIN "DISPUTES" d ON d.dispute_id = e.dispute_id
JOIN "BOOKINGS" b ON b.booking_id = d.booking_id
WHERE e.dispute_id = CAST(:dispute_id AS uuid)
  AND b.provider_id = CAST(:user_id AS uuid)
ORDER BY e.created_at ASC;