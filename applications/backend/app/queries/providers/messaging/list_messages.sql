-- PROV.MESSAGES.LIST — chronological thread; marks customer messages read (provider).
WITH thread AS (
    SELECT m.message_id, m.sender_role, m.sender_id, m.body,
           m.read_at, m.created_at
      FROM "MESSAGES" m
     WHERE m.conversation_id = CAST(:conversation_id AS uuid)
     ORDER BY m.created_at
     LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int)
),
read_done AS (
    UPDATE "MESSAGES" m
       SET read_at = now()
     WHERE m.conversation_id = CAST(:conversation_id AS uuid)
       AND m.sender_role = 'CUSTOMER'
       AND m.read_at IS NULL
    RETURNING 1
),
ownership AS (
    SELECT 1 FROM "CONVERSATIONS" c
      JOIN "BOOKINGS" b ON b.booking_id = c.booking_id
     WHERE c.conversation_id = CAST(:conversation_id AS uuid)
       AND b.provider_id = CAST(:user_id AS uuid)
)
SELECT * FROM thread WHERE EXISTS (SELECT 1 FROM ownership);
