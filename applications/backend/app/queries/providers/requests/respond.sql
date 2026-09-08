-- PRV.REQUESTS.RESPOND — record a response; guarded so only live feed items
-- are terminal-responded, while questions are allowed regardless of prior state
INSERT INTO "PROVIDER_REQUEST_RESPONSES" (
    provider_id, request_id, response_type, question_text, response_message
)
SELECT CAST(:user_id AS uuid), CAST(:request_id AS uuid),
       CAST(:response_type AS VARCHAR(12)), :question_text, :response_message
 WHERE EXISTS (SELECT 1
                 FROM "MATCH_CANDIDATES" mc
                 JOIN "SERVICE_REQUESTS" r ON r.request_id = mc.request_id
                WHERE mc.provider_id = CAST(:user_id AS uuid)
                  AND mc.request_id = CAST(:request_id AS uuid)
                  AND r.status IN ('VALID', 'SUBMITTED'))
   AND (CAST(:response_type AS VARCHAR(12)) = 'QUESTION'
        OR NOT EXISTS (SELECT 1 FROM "PROVIDER_REQUEST_RESPONSES" x
                        WHERE x.provider_id = CAST(:user_id AS uuid)
                          AND x.request_id = CAST(:request_id AS uuid)
                          AND x.response_type IN ('ACCEPTED', 'DECLINED')))
RETURNING response_id, provider_id, request_id, response_type,
          question_text, response_message, responded_at;