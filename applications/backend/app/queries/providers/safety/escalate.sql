-- PROV.SAFETY.REPORTS.ESCALATE - escalate an owned, still-open report
-- Only OPEN or UNDER_REVIEW reports can be escalated.
UPDATE "PROVIDER_SAFETY_REPORTS"
SET status = 'ESCALATED',
    escalated_at = now(),
    updated_at = now()
WHERE report_id = CAST(:report_id AS uuid)
  AND provider_id = CAST(:user_id AS uuid)
  AND status IN ('OPEN', 'UNDER_REVIEW')
RETURNING report_id, status, escalated_at, updated_at;
