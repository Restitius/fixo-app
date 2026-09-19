-- PROV.JOB_ASSIGNMENTS.CREATE - assign a team member to a booking
-- Ownership: both the booking and the team member must belong to this
-- provider, and the member must be ACTIVE.
INSERT INTO "PROVIDER_JOB_ASSIGNMENTS" (provider_id, booking_id, member_id, notes)
SELECT CAST(:provider_id AS uuid), CAST(:booking_id AS uuid), CAST(:member_id AS uuid), :notes
WHERE EXISTS (
    SELECT 1 FROM "BOOKINGS" b
    WHERE b.booking_id = CAST(:booking_id AS uuid) AND b.provider_id = CAST(:provider_id AS uuid)
)
AND EXISTS (
    SELECT 1 FROM "PROVIDER_TEAM_MEMBERS" m
    WHERE m.member_id = CAST(:member_id AS uuid)
      AND m.provider_id = CAST(:provider_id AS uuid)
      AND m.status = 'ACTIVE'
)
RETURNING assignment_id, provider_id, booking_id, member_id, status, notes, assigned_at;
