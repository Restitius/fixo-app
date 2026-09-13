-- PRV.REQUESTS.RESPOND — record a response. ACCEPTED must actually claim the
-- job (first accepter wins): the `claim` CTE atomically sets
-- selected_provider_id + status='PROVIDER_SELECTED', guarded on the request
-- not already being claimed by anyone — Postgres runs this UPDATE on every
-- call regardless of response_type, but its own WHERE clause makes it a
-- no-op for DECLINE/QUESTION (response_type <> 'ACCEPTED' never matches) and
-- for a second provider's ACCEPTED attempt (selected_provider_id is already
-- set by then, so 0 rows match — no lost-update race). The response row is
-- only inserted for ACCEPTED if this call actually won the claim; other
-- response types keep the original eligibility + not-already-terminal guard.
WITH claim AS (
    UPDATE "SERVICE_REQUESTS" r
       SET selected_provider_id = CAST(:user_id AS uuid),
           status = 'PROVIDER_SELECTED',
           updated_at = now()
     WHERE r.request_id = CAST(:request_id AS uuid)
       AND r.status IN ('VALID', 'SUBMITTED')
       AND r.selected_provider_id IS NULL
       AND CAST(:response_type AS VARCHAR(12)) = 'ACCEPTED'
       AND EXISTS (SELECT 1 FROM "MATCH_CANDIDATES" mc
                    WHERE mc.provider_id = CAST(:user_id AS uuid)
                      AND mc.request_id = r.request_id)
    RETURNING request_id
)
INSERT INTO "PROVIDER_REQUEST_RESPONSES" (
    provider_id, request_id, response_type, question_text, response_message
)
SELECT CAST(:user_id AS uuid), CAST(:request_id AS uuid),
       CAST(:response_type AS VARCHAR(12)), :question_text, :response_message
 WHERE (
        CAST(:response_type AS VARCHAR(12)) = 'ACCEPTED'
        AND EXISTS (SELECT 1 FROM claim)
       )
    OR (
        CAST(:response_type AS VARCHAR(12)) <> 'ACCEPTED'
        AND EXISTS (SELECT 1
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
       )
RETURNING response_id, provider_id, request_id, response_type,
          question_text, response_message, responded_at;