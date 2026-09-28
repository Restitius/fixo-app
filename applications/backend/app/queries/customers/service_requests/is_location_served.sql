-- CUS.REQUEST.AREA.CHECK — is the requested location inside our served areas?
-- Served when the address city or region matches any active area. A place such as
-- "Dar es Salaam" is both a city and a region, so the kind of the row and the
-- field the customer typed it into must not matter.
SELECT EXISTS (
           SELECT 1 FROM "SERVICE_AREAS"
            WHERE is_active
              AND lower(name) IN (lower(COALESCE(:city, '')), lower(COALESCE(:region, '')))
              AND name <> ''
       ) AS served;
