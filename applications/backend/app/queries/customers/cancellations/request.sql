-- CUS.CANCEL.REQUEST - guarded cancellation, pre-completion states only
WITH changed AS (
    UPDATE "BOOKINGS" b
       SET status = 'CANCELLED',
           cancelled_at = NOW(),
           cancellation_fee = :fee,
           refund_amount = :refund
     WHERE b.booking_id = CAST(:booking_id AS uuid)
       AND b.customer_id = CAST(:customer_id AS uuid)
       AND b.status IN ('CONFIRMED','PAYMENT_AUTHORIZED','ON_THE_WAY','ARRIVED','STARTED','IN_PROGRESS','COMPLETION_REQUESTED')
    RETURNING b.booking_id, b.booking_number, b.provider_id,
              b.status, b.cancellation_fee, b.refund_amount
), queued AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.BOOKING.CANCELLED.V1', 'provider', provider_id,
           jsonb_build_object('booking_id', booking_id, 'booking_number', booking_number)
      FROM changed
     WHERE provider_id IS NOT NULL
)
SELECT booking_id, status, cancellation_fee, refund_amount FROM changed;
