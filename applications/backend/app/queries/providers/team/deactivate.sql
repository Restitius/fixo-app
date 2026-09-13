-- PROV.TEAM.MEMBER.DEACTIVATE - remove a worker from the active roster (ownership-scoped)
UPDATE "PROVIDER_TEAM_MEMBERS"
SET status = 'INACTIVE',
    updated_at = now()
WHERE member_id = CAST(:member_id AS uuid)
  AND provider_id = CAST(:user_id AS uuid)
  AND status = 'ACTIVE'
RETURNING member_id, status, updated_at;
