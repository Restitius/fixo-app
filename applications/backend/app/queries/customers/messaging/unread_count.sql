-- CUS.MESSAGES.UNREAD_COUNT — provider messages not yet read by the customer.
SELECT count(*) AS unread_count
  FROM "MESSAGES" m
 WHERE m.conversation_id = CAST(:conversation_id AS uuid)
   AND m.sender_role = 'PROVIDER'
   AND m.read_at IS NULL
   AND EXISTS (
       SELECT 1 FROM "CONVERSATIONS" c
         JOIN "BOOKINGS" b ON b.booking_id = c.booking_id
        WHERE c.conversation_id = m.conversation_id
          AND b.customer_id = CAST(:customer_id AS uuid)
   );