-- PRV.REQUESTS.RESPONSES.LIST — this provider's response ledger
SELECT resp.response_id, resp.request_id, resp.response_type,
       resp.question_text, resp.response_message, resp.responded_at,
       r.request_number, s.name AS service_name
  FROM "PROVIDER_REQUEST_RESPONSES" resp
  JOIN "SERVICE_REQUESTS" r ON r.request_id = resp.request_id
  JOIN "SERVICES" s ON s.service_id = r.service_id
 WHERE resp.provider_id = CAST(:user_id AS uuid)
 ORDER BY resp.responded_at DESC
 LIMIT 50;