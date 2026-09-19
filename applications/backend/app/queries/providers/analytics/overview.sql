-- PROV.ANALYTICS.OVERVIEW - monthly trend: completed bookings, revenue,
-- average rating, and new vs repeat customers, for the trailing N months.
WITH months AS (
    SELECT date_trunc('month', d)::date AS period
    FROM generate_series(
        date_trunc('month', now()) - (CAST(:months AS int) - 1) * INTERVAL '1 month',
        date_trunc('month', now()),
        INTERVAL '1 month'
    ) AS d
),
completed AS (
    SELECT date_trunc('month', completed_at)::date AS period,
           COUNT(*) AS bookings_completed,
           COALESCE(SUM(agreed_amount), 0) AS revenue
    FROM "BOOKINGS"
    WHERE provider_id = CAST(:user_id AS uuid) AND status = 'CLOSED'
    GROUP BY 1
),
ratings AS (
    SELECT date_trunc('month', created_at)::date AS period,
           AVG(rating) AS average_rating
    FROM "PROVIDER_REVIEWS"
    WHERE provider_id = CAST(:user_id AS uuid)
    GROUP BY 1
),
customer_bookings AS (
    SELECT customer_id,
           date_trunc('month', completed_at)::date AS period,
           MIN(completed_at) OVER (PARTITION BY customer_id) AS first_completed_at
    FROM "BOOKINGS"
    WHERE provider_id = CAST(:user_id AS uuid) AND status = 'CLOSED'
),
customer_flags AS (
    SELECT DISTINCT customer_id, period,
           (date_trunc('month', first_completed_at)::date = period) AS is_new
    FROM customer_bookings
),
customer_agg AS (
    SELECT period,
           COUNT(*) FILTER (WHERE is_new) AS new_customers,
           COUNT(*) FILTER (WHERE NOT is_new) AS repeat_customers
    FROM customer_flags
    GROUP BY period
)
SELECT m.period,
       COALESCE(c.bookings_completed, 0) AS bookings_completed,
       COALESCE(c.revenue, 0) AS revenue,
       r.average_rating,
       COALESCE(ca.new_customers, 0) AS new_customers,
       COALESCE(ca.repeat_customers, 0) AS repeat_customers
FROM months m
LEFT JOIN completed c ON c.period = m.period
LEFT JOIN ratings r ON r.period = m.period
LEFT JOIN customer_agg ca ON ca.period = m.period
ORDER BY m.period ASC;
