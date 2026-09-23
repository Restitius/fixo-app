-- CUS.BOOKING.SET_STATUS — guarded workflow transition apply.
WITH changed AS (
    UPDATE "BOOKINGS"
       SET status = CAST(:to_state AS varchar), updated_at = now()
     WHERE booking_id = CAST(:booking_id AS uuid)
       AND customer_id = CAST(:customer_id AS uuid)
       AND status = CAST(:from_state AS varchar)
    RETURNING booking_id, booking_number, customer_id, provider_id, status
), queued AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT CASE status
               WHEN 'PAYMENT_AUTHORIZED' THEN 'NTF.PAYMENT.AUTHORIZED.V1'
               WHEN 'PAYMENT_FAILED' THEN 'NTF.PAYMENT.AUTHORIZATION_FAILED.V1'
               WHEN 'ON_THE_WAY' THEN 'NTF.BOOKING.ON_THE_WAY.V1'
               WHEN 'CANCELLED' THEN 'NTF.BOOKING.CANCELLED.V1'
           END,
           CASE WHEN status = 'CANCELLED' THEN 'provider' ELSE 'customer' END,
           CASE WHEN status = 'CANCELLED' THEN provider_id ELSE customer_id END,
           jsonb_build_object('booking_id', booking_id, 'booking_number', booking_number)
      FROM changed
     WHERE status IN ('PAYMENT_AUTHORIZED', 'PAYMENT_FAILED', 'ON_THE_WAY', 'CANCELLED')
       AND CASE WHEN status = 'CANCELLED' THEN provider_id ELSE customer_id END IS NOT NULL
)
SELECT booking_id, status FROM changed;
