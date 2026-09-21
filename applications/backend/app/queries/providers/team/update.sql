-- PROV.TEAM.MEMBER.UPDATE - modify a team member's details (ownership-scoped)
UPDATE "PROVIDER_TEAM_MEMBERS"
SET full_name  = COALESCE(:full_name, full_name),
    phone      = COALESCE(:phone, phone),
    email      = COALESCE(:email, email),
    role       = COALESCE(CAST(:role AS varchar), role),
    notes      = COALESCE(:notes, notes),
    updated_at = now()
WHERE member_id = CAST(:member_id AS uuid)
  AND provider_id = CAST(:user_id AS uuid)
RETURNING member_id, full_name, phone, email, role, status, notes, updated_at;
