-- PRV.MATCH.ELIGIBILITY — the provider-facing view of the signals the
-- matching engine weighs (Requirement Phase 12)
SELECT p.rating_avg, p.rating_count, p.jobs_completed,
       p.verification_status,
       (SELECT count(*) FROM "PROVIDER_SERVICES" ps
         WHERE ps.provider_id = p.provider_id
           AND ps.status = 'APPROVED') AS services_approved,
       (SELECT count(*) FROM "PROVIDER_SERVICES" ps
         WHERE ps.provider_id = p.provider_id
           AND ps.status <> 'ARCHIVED') AS services_total,
       (SELECT count(*) FROM "PROVIDER_SERVICE_PRICING" pp
         WHERE pp.provider_id = p.provider_id) AS services_priced,
       (SELECT count(*) FROM "PROVIDER_SERVICE_AREAS" a
         WHERE a.provider_id = p.provider_id AND a.is_active) AS active_areas,
       (SELECT count(*) FROM "PROVIDER_WORKING_HOURS" wh
         WHERE wh.provider_id = p.provider_id AND wh.is_available) AS working_days,
       (SELECT a.is_online FROM "PROVIDER_AVAILABILITY_SETTINGS" a
         WHERE a.provider_id = p.provider_id) AS is_online,
       (SELECT count(*) FROM "PROVIDER_REQUEST_RESPONSES" r
         WHERE r.provider_id = p.provider_id
           AND r.response_type = 'ACCEPTED') AS accepted_requests,
       (SELECT count(*) FROM "PROVIDER_REQUEST_RESPONSES" r
         WHERE r.provider_id = p.provider_id
           AND r.response_type = 'DECLINED') AS declined_requests,
       (SELECT avg(EXTRACT(EPOCH FROM (r2.responded_at - mc.created_at)) / 60)
          FROM "PROVIDER_REQUEST_RESPONSES" r2
          JOIN "MATCH_CANDIDATES" mc
            ON mc.provider_id = r2.provider_id
           AND mc.request_id = r2.request_id
         WHERE r2.provider_id = p.provider_id
           AND r2.response_type IN ('ACCEPTED', 'DECLINED')) AS response_time_minutes,
       (SELECT avg(pp2.base_amount) FROM "PROVIDER_SERVICE_PRICING" pp2
         WHERE pp2.provider_id = p.provider_id) AS avg_base_amount,
       p.created_at
  FROM "PROVIDERS" p
 WHERE p.provider_id = CAST(:user_id AS uuid);