-- CUS.PRIVACY.EXPORT.LIST
SELECT request_id, status, requested_at, completed_at, file_path
FROM "DATA_EXPORT_REQUESTS"
WHERE customer_id = CAST(:user_id AS uuid)
ORDER BY requested_at DESC
LIMIT :limit OFFSET :offset;