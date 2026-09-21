-- PROV.SAFETY.REPORTS.GET - single owned safety report
SELECT report_id, report_number, booking_id, category, severity, description,
       status, escalated_at, resolution, created_at, updated_at
FROM "PROVIDER_SAFETY_REPORTS"
WHERE report_id = CAST(:report_id AS uuid)
  AND provider_id = CAST(:user_id AS uuid)
LIMIT 1;
