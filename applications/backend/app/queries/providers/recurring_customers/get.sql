-- PROV.RECURRING_CUSTOMERS.GET - one customer's summary + note (ownership via a completed booking)
SELECT
    c.customer_id,
    c.full_name,
    c.phone,
    COUNT(*) AS total_bookings,
    COALESCE(SUM(b.agreed_amount), 0) AS total_spent,
    MIN(b.completed_at) AS first_completed_at,
    MAX(b.completed_at) AS last_completed_at,
    n.note
FROM "BOOKINGS" b
JOIN "CUSTOMERS" c ON c.customer_id = b.customer_id
LEFT JOIN "PROVIDER_CUSTOMER_NOTES" n
       ON n.provider_id = CAST(:user_id AS uuid) AND n.customer_id = b.customer_id
WHERE b.provider_id = CAST(:user_id AS uuid)
  AND b.status = 'CLOSED'
  AND b.customer_id = CAST(:customer_id AS uuid)
GROUP BY c.customer_id, c.full_name, c.phone, n.note;
