-- PRV.PROFILE.PUBLIC -- the profile exactly as customers will see it (preview)
SELECT display_name,
       profile_photo_url,
       headline AS professional_title,
       bio,
       languages,
       years_experience,
       qualifications, certifications, skills, specializations, tools,
       jobs_completed AS completed_projects,
       rating_avg, rating_count,
       city, region,
       verification_status
  FROM "PROVIDERS"
 WHERE provider_id = CAST(:user_id AS uuid);