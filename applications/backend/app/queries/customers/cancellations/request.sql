-- CUS.CANCEL.REQUEST - guarded cancellation, pre-completion states only
UPDATE "BOOKINGS" b
SET status = 'CANCELLED',
    cancelled_at = NOW(),
    cancellation_fee = :fee,
    refund_amount = :refund
WHERE b.booking_id = CAST(:booking_id AS uuid)
  AND b.customer_id = CAST(:customer_id AS uuid)
  AND b.status IN ('CONFIRMED','PAYMENT_AUTHORIZED','ON_THE_WAY','ARRIVED','STARTED','IN_PROGRESS','COMPLETION_REQUESTED')
RETURNING b.booking_id, b.status, b.cancellation_fee, b.refund_amount;
