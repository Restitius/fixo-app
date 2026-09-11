-- PROV.COMPLETION.SUBMIT — provider completes the job (Phase 25)
-- Atomic: guarded INSERT of the completion report plus the booking
-- transition STARTED/IN_PROGRESS -> COMPLETION_REQUESTED, so the
-- customer receives "Provider has completed the job" (Phase 26 sign-off
-- confirms it via the Module 25 flow). One report per booking (UNIQUE).
WITH ins AS (
    INSERT INTO "BOOKING_JOB_COMPLETIONS"
           (booking_id, provider_id, completion_notes, work_performed,
            materials_summary, before_after_evidence, warranty_details,
            recommended_followup, maintenance_recommendations)
    SELECT b.booking_id,
           b.provider_id,
           CAST(:completion_notes AS varchar),
           CAST(:work_performed AS varchar),
           CAST(:materials_summary AS varchar),
           CAST(:before_after_evidence AS json),
           CAST(:warranty_details AS varchar),
           CAST(:recommended_followup AS varchar),
           CAST(:maintenance_recommendations AS varchar)
      FROM "BOOKINGS" b
     WHERE b.booking_id  = CAST(:booking_id AS uuid)
       AND b.provider_id = CAST(:user_id AS uuid)
       AND b.status IN ('STARTED','IN_PROGRESS')
       AND NOT EXISTS (
           SELECT 1 FROM "BOOKING_JOB_COMPLETIONS" x
            WHERE x.booking_id = b.booking_id)
    RETURNING completion_id, booking_id, provider_id, completion_notes,
              work_performed, materials_summary, before_after_evidence,
              warranty_details, recommended_followup,
              maintenance_recommendations, created_at
), upd AS (
    UPDATE "BOOKINGS" b
       SET status    = 'COMPLETION_REQUESTED',
           updated_at = now()
      FROM ins
     WHERE b.booking_id = ins.booking_id
    RETURNING b.booking_id, b.status, b.customer_id
)
SELECT i.completion_id, i.booking_id, i.provider_id, i.completion_notes,
       i.work_performed, i.materials_summary, i.before_after_evidence,
       i.warranty_details, i.recommended_followup,
       i.maintenance_recommendations, i.created_at,
       u.status AS booking_status, u.customer_id
  FROM ins i
  JOIN upd u ON u.booking_id = i.booking_id;
