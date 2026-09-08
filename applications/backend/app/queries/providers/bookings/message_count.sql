-- PROV.BOOKING.MESSAGE_COUNT -- unread/total messages for a booking (Phase 16)
SELECT
    count(*) AS total_messages,
    count(*) FILTER (WHERE m.read_at IS NULL AND m.sender_role = 'CUSTOMER') AS unread_customer_messages
  FROM "CONVERSATIONS" conv
  JOIN "MESSAGES" m ON m.conversation_id = conv.conversation_id
 WHERE conv.booking_id = CAST(:booking_id AS uuid)
   AND conv.provider_id = CAST(:user_id AS uuid);
