-- CUS.CANCEL.RECORD - persist the cancellation decision
INSERT INTO "CANCELLATIONS" (booking_id, customer_id, fee_charged, refund_due, reason, requested_by)
VALUES (CAST(:booking_id AS uuid), CAST(:customer_id AS uuid), :fee, :refund, :reason, :requested_by)
RETURNING cancellation_id, booking_id, fee_charged, refund_due, reason, created_at;
