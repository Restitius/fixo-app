-- CUS.WARRANTY.LIST.V1 - warranties owned by the authenticated customer.
SELECT w.warranty_id, w.booking_id, b.booking_number, w.provider_id, p.display_name AS provider_name,
       w.service_id, s.name AS service_name, w.status, w.issued_at, w.expires_at,
       w.claim_deadline, w.terms, w.issued_at AS starts_at,
       cl.claim_id, cl.status AS claim_status, cl.description AS claim_description,
       cl.created_at AS claimed_at
  FROM "WARRANTIES" w
  JOIN "BOOKINGS" b ON b.booking_id = w.booking_id
  JOIN "PROVIDERS" p ON p.provider_id = w.provider_id
  LEFT JOIN "SERVICES" s ON s.service_id = w.service_id
  LEFT JOIN LATERAL (
      SELECT c.claim_id, c.status, c.description, c.created_at FROM "WARRANTY_CLAIMS" c
       WHERE c.warranty_id = w.warranty_id ORDER BY c.created_at DESC LIMIT 1
  ) cl ON true
 WHERE w.customer_id = CAST(:customer_id AS uuid)
 ORDER BY w.issued_at DESC
 LIMIT CAST(:limit AS INT) OFFSET CAST(:offset AS INT);