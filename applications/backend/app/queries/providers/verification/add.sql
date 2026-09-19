-- PRV.VER.DOC.ADD -- upload a verification document (Provider Req Phase 5)
INSERT INTO "PROVIDER_VERIFICATION_DOCUMENTS" (
    provider_id, doc_type, doc_number, front_image_url, back_image_url,
    issue_date, expiry_date
)
VALUES (
    CAST(:user_id AS uuid), :doc_type, :doc_number, :front_image_url,
    :back_image_url, :issue_date, :expiry_date
)
RETURNING doc_id, doc_type, doc_number, front_image_url, back_image_url,
          issue_date, expiry_date, status, created_at;
