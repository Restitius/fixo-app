-- PROV.RECURRING_CUSTOMERS.NOTE.SET - upsert a private note; requires a
-- completed booking with this customer (defense against leaving notes on
-- customers never actually served).
INSERT INTO "PROVIDER_CUSTOMER_NOTES" (provider_id, customer_id, note)
SELECT CAST(:provider_id AS uuid), CAST(:customer_id AS uuid), :note
WHERE EXISTS (
    SELECT 1 FROM "BOOKINGS" b
    WHERE b.provider_id = CAST(:provider_id AS uuid)
      AND b.customer_id = CAST(:customer_id AS uuid)
      AND b.status = 'CLOSED'
)
ON CONFLICT (provider_id, customer_id)
DO UPDATE SET note = EXCLUDED.note, updated_at = now()
RETURNING provider_id, customer_id, note, updated_at;
