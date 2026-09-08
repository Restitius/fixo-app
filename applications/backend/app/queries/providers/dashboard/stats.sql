-- PRV.DASH.STATS — the four primary statistics (Requirement Phase 10)
SELECT p.rating_avg, p.rating_count, p.jobs_completed,
       (SELECT count(*) FROM "BOOKINGS" b
         WHERE b.provider_id = p.provider_id
           AND b.scheduled_date = CURRENT_DATE
           AND b.status <> 'CANCELLED') AS todays_jobs,
       (SELECT count(*) FROM "MATCH_CANDIDATES" mc
         JOIN "SERVICE_REQUESTS" r ON r.request_id = mc.request_id
        WHERE mc.provider_id = p.provider_id
          AND r.status = 'VALID'
          AND NOT EXISTS (SELECT 1 FROM "QUOTATIONS" q
                           WHERE q.request_id = mc.request_id
                             AND q.provider_id = mc.provider_id)) AS pending_requests,
       (SELECT count(*) FROM "BOOKINGS" b
         WHERE b.provider_id = p.provider_id
           AND b.status IN ('ON_THE_WAY', 'ARRIVED', 'STARTED',
                            'IN_PROGRESS', 'COMPLETION_REQUESTED')) AS active_jobs
  FROM "PROVIDERS" p
 WHERE p.provider_id = CAST(:user_id AS uuid);