-- CUS.MESSAGES.SEND — customer posts to the booking's conversation.
INSERT INTO "MESSAGES" (conversation_id, sender_role, sender_id, body)
SELECT c.conversation_id, 'CUSTOMER', CAST(:customer_id AS uuid), :body
  FROM "CONVERSATIONS" c
  JOIN "BOOKINGS" b ON b.booking_id = c.booking_id
 WHERE c.conversation_id = CAST(:conversation_id AS uuid)
   AND b.customer_id = CAST(:customer_id AS uuid)
RETURNING message_id, conversation_id, sender_role, body, created_at;