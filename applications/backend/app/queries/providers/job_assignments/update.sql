-- PROV.JOB_ASSIGNMENTS.UPDATE - reassign a member and/or change status/notes
-- (ownership-scoped; a new member_id must belong to this provider and be ACTIVE)
UPDATE "PROVIDER_JOB_ASSIGNMENTS" a
SET member_id  = COALESCE(CAST(:member_id AS uuid), member_id),
    status     = COALESCE(CAST(:status AS varchar), status),
    notes      = COALESCE(:notes, notes),
    updated_at = now()
WHERE a.assignment_id = CAST(:assignment_id AS uuid)
  AND a.provider_id = CAST(:user_id AS uuid)
  AND (
        CAST(:member_id AS uuid) IS NULL
        OR EXISTS (
            SELECT 1 FROM "PROVIDER_TEAM_MEMBERS" m
            WHERE m.member_id = CAST(:member_id AS uuid)
              AND m.provider_id = CAST(:user_id AS uuid)
              AND m.status = 'ACTIVE'
        )
      )
RETURNING assignment_id, member_id, status, notes, updated_at;
