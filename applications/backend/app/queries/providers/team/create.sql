-- PROV.TEAM.MEMBER.CREATE - add a worker to the provider's team
INSERT INTO "PROVIDER_TEAM_MEMBERS" (provider_id, full_name, phone, email, role, notes)
VALUES (CAST(:provider_id AS uuid), :full_name, :phone, :email, :role, :notes)
RETURNING member_id, provider_id, full_name, phone, email, role, status, notes, created_at;
