-- PROV.TEAM.MEMBER.GET - single owned team member
SELECT member_id, full_name, phone, email, role, status, notes, created_at, updated_at
FROM "PROVIDER_TEAM_MEMBERS"
WHERE member_id = CAST(:member_id AS uuid)
  AND provider_id = CAST(:user_id AS uuid);
