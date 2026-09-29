-- CUS.BOOKING.CREATE — snapshot the accepted quote into a CONFIRMED booking,
-- and durably record the NTF.BOOKING.CONFIRMED.V1 outbox row for both the
-- customer and the assigned provider, atomically with the booking write.
--
-- :promo_id / :discount_amount / :promo_code are optional (NULL / 0 / NULL
-- for a plain booking, the service layer resolves them from a promo code
-- first). When a promo is supplied, this statement is also what enforces
-- "one redemption per customer per promotion": the PROMOTION_REDEMPTIONS
-- insert (guarded by its UNIQUE (promo_id, customer_id), ON CONFLICT DO
-- NOTHING) feeds the booking insert below it, so if the redemption is
-- refused — a race with another booking that just used the same code —
-- no booking row is produced either. The caller sees "could not create
-- the booking" and nothing is charged.
WITH ids AS (
    SELECT gen_random_uuid() AS booking_id
), quote_src AS (
    SELECT r.request_id, r.customer_id, q.provider_id, q.quote_id, r.service_id,
           r.address_id, r.preferred_date, r.time_window, q.amount, q.currency
      FROM "SERVICE_REQUESTS" r
      JOIN "QUOTATIONS" q ON q.request_id = r.request_id
     WHERE q.quote_id = CAST(:quote_id AS uuid)
       AND r.customer_id = CAST(:customer_id AS uuid)
       AND r.status = 'QUOTE_ACCEPTED'
       AND q.status = 'ACCEPTED'
), redemption AS (
    INSERT INTO "PROMOTION_REDEMPTIONS" (promo_id, customer_id, booking_id, discount_amount)
    SELECT CAST(:promo_id AS uuid), CAST(:customer_id AS uuid), ids.booking_id,
           COALESCE(CAST(:discount_amount AS numeric), 0)
      FROM ids
     WHERE CAST(:promo_id AS uuid) IS NOT NULL
    ON CONFLICT (promo_id, customer_id) DO NOTHING
    RETURNING promo_id
), ins AS (
    INSERT INTO "BOOKINGS" (
        booking_id, request_id, customer_id, provider_id, quote_id, service_id,
        address_id, scheduled_date, time_window,
        agreed_amount, currency, booking_number, status,
        arrival_code, promo_id, promo_code, discount_amount
    )
    SELECT ids.booking_id, qs.request_id, qs.customer_id, qs.provider_id, qs.quote_id, qs.service_id,
           qs.address_id,
           COALESCE(qs.preferred_date, CAST(now() + interval '2 days' AS date)),
           COALESCE(qs.time_window, 'MORNING'),
           GREATEST(qs.amount - COALESCE(CAST(:discount_amount AS numeric), 0), 0), qs.currency,
           'BK-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text), 1, 4)),
           'CONFIRMED',
           lpad((random() * 999999)::int::text, 6, '0'),
           CAST(:promo_id AS uuid), CAST(:promo_code AS varchar), COALESCE(CAST(:discount_amount AS numeric), 0)
      FROM quote_src qs
      JOIN ids ON true
     WHERE CAST(:promo_id AS uuid) IS NULL OR EXISTS (SELECT 1 FROM redemption)
    RETURNING booking_id, booking_number, status, agreed_amount, currency,
              arrival_code, customer_id, provider_id, discount_amount
), promo_used AS (
    UPDATE "PROMOTIONS" p
       SET used_count = used_count + 1
      FROM ins
     WHERE p.promo_id = CAST(:promo_id AS uuid) AND ins.booking_id IS NOT NULL
    RETURNING p.promo_id
), outbox_ins AS (
    INSERT INTO "NOTIFICATION_OUTBOX" (event_key, recipient_type, recipient_id, payload)
    SELECT 'NTF.BOOKING.CONFIRMED.V1', v.recipient_type, v.recipient_id,
           jsonb_build_object('booking_id', ins.booking_id, 'booking_number', ins.booking_number)
      FROM ins
      CROSS JOIN LATERAL (
          VALUES ('customer', ins.customer_id), ('provider', ins.provider_id)
      ) AS v(recipient_type, recipient_id)
    RETURNING outbox_id
)
SELECT ins.booking_id, ins.booking_number, ins.status, ins.agreed_amount,
       ins.currency, ins.arrival_code, ins.discount_amount
  FROM ins
  LEFT JOIN (SELECT count(*) FROM outbox_ins) AS _outbox_forced ON true
  LEFT JOIN (SELECT count(*) FROM promo_used) AS _promo_forced ON true;
