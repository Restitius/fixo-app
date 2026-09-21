-- PRV.VER.STATUS -- verification progress aggregate for the provider dashboard (Provider Req Phase 5)
SELECT p.verification_status,
       (SELECT COUNT(*) FROM "PROVIDER_VERIFICATION_DOCUMENTS" d
         WHERE d.provider_id = p.provider_id AND d.deleted_at IS NULL) AS documents_total,
       (SELECT COUNT(*) FROM "PROVIDER_VERIFICATION_DOCUMENTS" d
         WHERE d.provider_id = p.provider_id AND d.deleted_at IS NULL
           AND d.status = 'VERIFIED') AS documents_verified,
       (SELECT COUNT(*) FROM "PROVIDER_VERIFICATION_DOCUMENTS" d
         WHERE d.provider_id = p.provider_id AND d.deleted_at IS NULL
           AND d.status IN ('SUBMITTED', 'UNDER_REVIEW')) AS documents_pending,
       (SELECT COUNT(*) FROM "PROVIDER_VERIFICATION_DOCUMENTS" d
         WHERE d.provider_id = p.provider_id AND d.deleted_at IS NULL
           AND d.status = 'REJECTED') AS documents_rejected,
       (SELECT COUNT(*) FROM "PROVIDER_VERIFICATION_DOCUMENTS" d
         WHERE d.provider_id = p.provider_id AND d.deleted_at IS NULL
           AND d.status = 'MORE_INFO_REQUIRED') AS documents_more_info,
       (SELECT COUNT(*) FROM "PROVIDER_VERIFICATION_DOCUMENTS" d
         WHERE d.provider_id = p.provider_id AND d.deleted_at IS NULL
           AND d.status <> 'VERIFIED'
           AND d.expiry_date IS NOT NULL
           AND d.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')) AS documents_expiring_soon,
       (SELECT COUNT(*) FROM "PROVIDER_DOC_TYPES" t WHERE t.is_required) AS required_total,
       (SELECT COALESCE(json_agg(t.code), '[]'::json)
          FROM "PROVIDER_DOC_TYPES" t
         WHERE t.is_required
           AND NOT EXISTS (
                SELECT 1 FROM "PROVIDER_VERIFICATION_DOCUMENTS" d2
                 WHERE d2.provider_id = p.provider_id
                   AND d2.doc_type = t.code
                   AND d2.status = 'VERIFIED'
                   AND d2.deleted_at IS NULL)) AS required_missing
  FROM "PROVIDERS" p
 WHERE p.provider_id = CAST(:user_id AS uuid);
