-- PRV.PROFILE.UPDATE -- curate profile fields; absent params keep current values
UPDATE "PROVIDERS"
   SET profile_photo_url = COALESCE(:profile_photo_url, profile_photo_url),
       gender            = COALESCE(:gender, gender),
       date_of_birth     = COALESCE(CAST(:date_of_birth AS DATE), date_of_birth),
       bio               = COALESCE(:bio, bio),
       languages         = COALESCE(:languages, languages),
       years_experience  = COALESCE(:years_experience, years_experience),
       headline          = COALESCE(:professional_title, headline),
       qualifications    = COALESCE(CAST(:qualifications AS jsonb), qualifications),
       certifications    = COALESCE(CAST(:certifications AS jsonb), certifications),
       skills            = COALESCE(CAST(:skills AS jsonb), skills),
       specializations   = COALESCE(CAST(:specializations AS jsonb), specializations),
       tools             = COALESCE(CAST(:tools AS jsonb), tools),
       profile_updated_at = now(),
       updated_at        = now()
 WHERE provider_id = CAST(:user_id AS uuid)
RETURNING provider_id, display_name,
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
          profile_updated_at;