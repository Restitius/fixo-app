-- CUS.BOOKING.CREATE — snapshot the accepted quote into a CONFIRMED booking,
-- and durably record the NTF.BOOKING.CONFIRMED.V1 outbox row for both the
-- customer and the assigned provider, atomically with the booking write.
WITH ins AS (
    INSERT INTO "BOOKINGS" (
        request_id, customer_id, provider_id, quote_id, service_id,
        address_id, scheduled_date, time_window,
        agreed_amount, currency, booking_number, status,
        arrival_code
    )
    SELECT r.request_id, r.customer_id, q.provider_id, q.quote_id, r.service_id,
           r.address_id,
           COALESCE(r.preferred_date, CAST(now() + interval '2 days' AS date)),
           COALESCE(r.time_window, 'MORNING'),
           q.amount, q.currency,
           'BK-' || to_char(now(), 'YYMMDDHH24MI') || '-' || upper(substr(md5(random()::text), 1, 4)),
           'CONFIRMED',
           lpad((random() * 999999)::int::text, 6, '0')
      FROM "SERVICE_REQUESTS" r
      JOIN "QUOTATIONS" q ON q.request_id = r.request_id
     WHERE q.quote_id = CAST(:quote_id AS uuid)
       AND r.customer_id = CAST(:customer_id AS uuid)
       AND r.status = 'QUOTE_ACCEPTED'
       AND q.status = 'ACCEPTED'
    RETURNING booking_id, booking_number, status, agreed_amount, currency,
              arrival_code, customer_id, provider_id
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
       ins.currency, ins.arrival_code
  FROM ins
  LEFT JOIN (SELECT count(*) FROM outbox_ins) AS _outbox_forced ON true;
