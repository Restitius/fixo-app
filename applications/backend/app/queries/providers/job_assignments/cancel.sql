-- PROV.JOB_ASSIGNMENTS.CANCEL - cancel an active assignment (ownership-scoped)
UPDATE "PROVIDER_JOB_ASSIGNMENTS"
SET status = 'CANCELLED',
    updated_at = now()
WHERE assignment_id = CAST(:assignment_id AS uuid)
  AND provider_id = CAST(:user_id AS uuid)
  AND status NOT IN ('COMPLETED', 'CANCELLED')
RETURNING assignment_id, status, updated_at;
