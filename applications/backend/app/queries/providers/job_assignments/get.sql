-- PROV.JOB_ASSIGNMENTS.GET - single owned assignment
SELECT a.assignment_id, a.booking_id, b.booking_number, a.member_id, m.full_name AS member_name,
       a.status, a.notes, a.assigned_at, a.updated_at
FROM "PROVIDER_JOB_ASSIGNMENTS" a
JOIN "BOOKINGS" b ON b.booking_id = a.booking_id
JOIN "PROVIDER_TEAM_MEMBERS" m ON m.member_id = a.member_id
WHERE a.assignment_id = CAST(:assignment_id AS uuid)
  AND a.provider_id = CAST(:user_id AS uuid);
