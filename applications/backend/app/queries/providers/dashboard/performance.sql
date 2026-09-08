-- PRV.DASH.PERFORMANCE — rates derived from the provider's booking history
SELECT count(*) AS total_bookings,
       count(*) FILTER (WHERE status = 'CANCELLED') AS cancelled_bookings,
       count(*) FILTER (WHERE status IN ('CUSTOMER_CONFIRMED', 'PAID', 'CLOSED'))
         AS completed_bookings,
       count(*) FILTER (WHERE status = 'PAYMENT_FAILED') AS payment_failed_bookings,
       COALESCE(avg(CASE WHEN status IN ('CUSTOMER_CONFIRMED', 'PAID', 'CLOSED')
                         THEN agreed_amount END), 0) AS avg_completed_value
  FROM "BOOKINGS"
 WHERE provider_id = CAST(:user_id AS uuid);