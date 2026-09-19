-- PROV.COMPLETION.GET — the completion report of a provider booking (Phase 25)
SELECT jc.completion_id, jc.booking_id, jc.provider_id, jc.completion_notes,
       jc.work_performed, jc.materials_summary, jc.before_after_evidence,
       jc.warranty_details, jc.recommended_followup,
       jc.maintenance_recommendations, jc.created_at,
       b.status AS booking_status
  FROM "BOOKING_JOB_COMPLETIONS" jc
  JOIN "BOOKINGS" b ON b.booking_id = jc.booking_id
 WHERE jc.provider_id = CAST(:user_id AS uuid)
   AND jc.booking_id  = CAST(:booking_id AS uuid);
