-- PROV.EQUIPMENT.ASSIGN - check equipment out to a team member, or release it
-- (:member_id NULL releases it). Blocked while under MAINTENANCE or RETIRED.
-- A new assignee must be an ACTIVE member of this provider.
UPDATE "PROVIDER_EQUIPMENT" e
SET assigned_member_id = CAST(:member_id AS uuid),
    status = CASE WHEN CAST(:member_id AS uuid) IS NULL THEN 'AVAILABLE' ELSE 'IN_USE' END,
    updated_at = now()
WHERE e.equipment_id = CAST(:equipment_id AS uuid)
  AND e.provider_id = CAST(:user_id AS uuid)
  AND e.status IN ('AVAILABLE', 'IN_USE')
  AND (
        CAST(:member_id AS uuid) IS NULL
        OR EXISTS (
            SELECT 1 FROM "PROVIDER_TEAM_MEMBERS" m
            WHERE m.member_id = CAST(:member_id AS uuid)
              AND m.provider_id = CAST(:user_id AS uuid)
              AND m.status = 'ACTIVE'
        )
      )
RETURNING equipment_id, assigned_member_id, status, updated_at;
