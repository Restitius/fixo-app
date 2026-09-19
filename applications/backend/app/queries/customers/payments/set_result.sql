-- CUS.PAYMENT.SET_RESULT — close the attempt; ownership re-checked via BOOKINGS.
WITH target AS (
    SELECT p.payment_id, b.booking_id
      FROM "PAYMENTS" p
      JOIN "BOOKINGS" b ON b.booking_id = p.booking_id
     WHERE p.payment_id = CAST(:payment_id AS uuid)
       AND b.customer_id = CAST(:customer_id AS uuid)
),
closed AS (
    UPDATE "PAYMENTS" pay
       SET status = CAST(:result AS varchar),
           gateway_ref = COALESCE(:gateway_ref, gateway_ref),
           failure_reason = :failure_reason,
           authorized_at = CASE WHEN :result = 'AUTHORIZED' THEN now() ELSE NULL END
     WHERE pay.payment_id IN (SELECT payment_id FROM target)
    RETURNING pay.payment_id, pay.booking_id
),
counted AS (
    UPDATE "BOOKINGS" b
       SET payment_attempts = payment_attempts + 1,
           updated_at = now()
     WHERE b.booking_id IN (SELECT booking_id FROM closed)
    RETURNING b.booking_id
)
SELECT booking_id FROM counted;