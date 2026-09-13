-- PROV.TEAM.MEMBERS.LIST - the provider's team roster
SELECT member_id, full_name, phone, email, role, status, notes, created_at, updated_at
FROM "PROVIDER_TEAM_MEMBERS"
WHERE provider_id = CAST(:user_id AS uuid)
  AND (CAST(:status AS varchar) IS NULL OR status = :status)
  AND (CAST(:role AS varchar) IS NULL OR role = :role)
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
