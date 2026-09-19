-- PROV.SAFETY.REPORTS.CREATE - file a provider safety/incident report
-- Ownership: if a booking is named, it must belong to the reporting provider.
INSERT INTO "PROVIDER_SAFETY_REPORTS" (provider_id, booking_id, category, severity, description)
SELECT
    CAST(:provider_id AS uuid),
    CAST(:booking_id AS uuid),
    :category,
    :severity,
    :description
WHERE CAST(:booking_id AS uuid) IS NULL
   OR EXISTS (
        SELECT 1 FROM "BOOKINGS" b
        WHERE b.booking_id = CAST(:booking_id AS uuid)
          AND b.provider_id = CAST(:provider_id AS uuid)
      )
RETURNING report_id, report_number, provider_id, booking_id, category, severity,
          description, status, created_at;
