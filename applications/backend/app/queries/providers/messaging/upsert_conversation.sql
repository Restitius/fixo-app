-- PROV.MESSAGES.CONVERSATION.GET — open-or-fetch the booking's conversation (provider).
INSERT INTO "CONVERSATIONS" (booking_id, customer_id, provider_id)
SELECT b.booking_id, b.customer_id, b.provider_id
  FROM "BOOKINGS" b
 WHERE b.booking_id = CAST(:booking_id AS uuid)
   AND b.provider_id = CAST(:user_id AS uuid)
ON CONFLICT (booking_id) DO UPDATE
   SET conversation_id = "CONVERSATIONS".conversation_id
RETURNING conversation_id, booking_id, customer_id, provider_id;
