-- Attach evidence file to an ACTIVE dispute (row-lock via FOR UPDATE)
WITH d AS (
    SELECT dispute_id FROM "DISPUTES"
    WHERE dispute_id = CAST(:dispute_id AS uuid)
      AND customer_id = CAST(:customer_id AS uuid)
      AND status IN ('OPEN','UNDER_REVIEW')
    FOR UPDATE
)
INSERT INTO "DISPUTE_EVIDENCE" (dispute_id, file_name, file_path, mime_type, size_bytes)
SELECT d.dispute_id, :file_name, :file_path, :mime_type, :size_bytes FROM d
RETURNING evidence_id;
