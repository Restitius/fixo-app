-- CUS.PAYMENT.MARK_CAPTURED — stamp the captured attempt +
-- record capture_ref; ownership via booking. Writes the
-- NTF.PAYMENT.CAPTURED.V1 outbox row atomically.
WITH owned AS (
    SELECT p.payment_id, b.booking_id, b.customer_id, b.booking_number
      FROM "PAYMENTS" p
      JOIN "BOOKINGS" b ON b.booking_id = p.booking_id
     WHERE p.payment_id = CAST(:payment_id AS uuid)
       AND b.customer_id = CAST(:customer_id AS uuid)
), upd AS (
    UPDATE "PAYMENTS" pay
       SET captured_at = now(),
           gateway_ref = COALESCE(:capture_ref, gateway_ref)
     WHERE pay.payment_id IN (SELECT payment_id FROM owned)
    RETURNING pay.payment_id
), outbox_ins AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.PAYMENT.CAPTURED.V1', 'customer', owned.customer_id,
           jsonb_build_object('booking_id', owned.booking_id, 'booking_number', owned.booking_number)
      FROM owned
      JOIN upd ON upd.payment_id = owned.payment_id
    RETURNING outbox_id
)
SELECT upd.payment_id
  FROM upd
  LEFT JOIN (SELECT count(*) FROM outbox_ins) AS _outbox_forced ON true;
