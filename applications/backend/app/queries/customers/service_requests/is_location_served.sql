-- CUS.REQUEST.AREA.CHECK — is the requested location inside our served areas?
-- Served when the city matches a CITY row, or the region matches a REGION row.
SELECT EXISTS (
           SELECT 1 FROM "SERVICE_AREAS"
            WHERE is_active AND kind = 'CITY'
              AND lower(name) = lower(COALESCE(:city, ''))
       ) OR EXISTS (
           SELECT 1 FROM "SERVICE_AREAS"
            WHERE is_active AND kind = 'REGION'
              AND lower(name) = lower(COALESCE(:region, ''))
       ) AS served;