-- PROV.SAFETY.REPORTS.LIST - provider safety reports, newest first
-- Optional filters: status, category.
SELECT report_id, report_number, booking_id, category, severity, description,
       status, escalated_at, created_at, updated_at
FROM "PROVIDER_SAFETY_REPORTS"
WHERE provider_id = CAST(:user_id AS uuid)
  AND (CAST(:status AS varchar) IS NULL OR status = :status)
  AND (CAST(:category AS varchar) IS NULL OR category = :category)
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
