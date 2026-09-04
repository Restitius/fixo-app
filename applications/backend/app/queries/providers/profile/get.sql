-- PRV.PROFILE.GET -- provider's own full profile (Requirement Phase 3)
SELECT provider_id, display_name,
       first_name, middle_name, last_name,
       email, phone,
       profile_photo_url, gender, date_of_birth,
       bio, languages, years_experience,
       headline AS professional_title,
       qualifications, certifications, skills, specializations, tools,
       jobs_completed AS completed_projects,
       rating_avg, rating_count,
       account_type, status, verification_status,
       city, region, district,
       profile_updated_at
  FROM "PROVIDERS"
 WHERE provider_id = CAST(:user_id AS uuid);