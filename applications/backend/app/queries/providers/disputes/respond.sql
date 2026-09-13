-- PROV.DISPUTE.RESPOND - provider submits a response on an owned dispute
-- Provider ownership enforced via BOOKINGS.provider_id.
INSERT INTO "PROVIDER_DISPUTE_RESPONSES" (dispute_id, provider_id, kind, body)
SELECT
    CAST(:dispute_id AS uuid),
    CAST(:provider_id AS uuid),
    :kind::text,
    :body::text
WHERE EXISTS (
    SELECT 1
    FROM "DISPUTES" d
    JOIN "BOOKINGS" b ON b.booking_id = d.booking_id
    WHERE d.dispute_id = CAST(:dispute_id AS uuid)
      AND b.provider_id = CAST(:provider_id AS uuid)
      AND d.status NOT IN ('RESOLVED', 'WITHDRAWN')
)
RETURNING response_id, dispute_id, provider_id, kind, body, created_at;