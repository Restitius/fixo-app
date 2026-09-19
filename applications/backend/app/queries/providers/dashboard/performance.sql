-- PRV.DASH.PERFORMANCE — rates derived from booking history and the
-- Phase 11 provider-response ledger
SELECT count(*) AS total_bookings,
       count(*) FILTER (WHERE status = 'CANCELLED') AS cancelled_bookings,
       count(*) FILTER (WHERE status IN ('CUSTOMER_CONFIRMED', 'PAID', 'CLOSED'))
         AS completed_bookings,
       count(*) FILTER (WHERE status = 'PAYMENT_FAILED') AS payment_failed_bookings,
       COALESCE(avg(CASE WHEN status IN ('CUSTOMER_CONFIRMED', 'PAID', 'CLOSED')
                         THEN agreed_amount END), 0) AS avg_completed_value,
       (SELECT count(*) FROM "PROVIDER_REQUEST_RESPONSES" resp
         WHERE resp.provider_id = CAST(:user_id AS uuid)
           AND resp.response_type = 'ACCEPTED') AS accepted_requests,
       (SELECT count(*) FROM "PROVIDER_REQUEST_RESPONSES" resp
         WHERE resp.provider_id = CAST(:user_id AS uuid)
           AND resp.response_type = 'DECLINED') AS declined_requests,
       (SELECT avg(EXTRACT(EPOCH FROM (resp.responded_at - mc.created_at)) / 60)
          FROM "PROVIDER_REQUEST_RESPONSES" resp
          JOIN "MATCH_CANDIDATES" mc
            ON mc.provider_id = resp.provider_id
           AND mc.request_id = resp.request_id
         WHERE resp.provider_id = CAST(:user_id AS uuid)
           AND resp.response_type IN ('ACCEPTED', 'DECLINED')) AS avg_response_minutes
  FROM "BOOKINGS"
 WHERE provider_id = CAST(:user_id AS uuid);