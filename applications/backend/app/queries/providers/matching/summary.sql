-- PRV.MATCH.SUMMARY — match-opportunity counts: what is pending vs acted on
SELECT count(*) AS total_matches,
       count(*) FILTER (WHERE NOT EXISTS (
           SELECT 1 FROM "PROVIDER_REQUEST_RESPONSES" pr
            WHERE pr.provider_id = mc.provider_id
              AND pr.request_id = mc.request_id
              AND pr.response_type IN ('ACCEPTED', 'DECLINED')
           )
       ) AS pending_actions,
       count(*) FILTER (WHERE EXISTS (
           SELECT 1 FROM "QUOTATIONS" q
            WHERE q.request_id = mc.request_id
              AND q.provider_id = mc.provider_id
           )
       ) AS quoted_requests,
       count(*) FILTER (WHERE EXISTS (
           SELECT 1 FROM "PROVIDER_REQUEST_RESPONSES" pr
            WHERE pr.provider_id = mc.provider_id
              AND pr.request_id = mc.request_id
              AND pr.response_type = 'ACCEPTED'
           )
       ) AS accepted_requests,
       count(*) FILTER (WHERE EXISTS (
           SELECT 1 FROM "BOOKINGS" b
            WHERE b.request_id = mc.request_id
              AND b.provider_id = mc.provider_id
           )
       ) AS selected_requests
  FROM "MATCH_CANDIDATES" mc
 WHERE mc.provider_id = CAST(:user_id AS uuid);