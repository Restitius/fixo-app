-- CUS.PRIVACY.EXPORT.REQUEST
-- Uses the SP to insert + return request_id/status atomically
SELECT * FROM SP_REQUEST_DATA_EXPORT(CAST(:user_id AS uuid))
  AS t(request_id, status);