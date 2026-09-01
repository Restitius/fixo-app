-- CUS.SEARCH.SERVICES — trigram similarity + ILIKE fallback, ranked in-database.
SELECT s.service_id, s.slug, s.name, s.description, s.icon,
       c.code AS category_code, c.name AS category_name,
       GREATEST(similarity(s.name, :term), similarity(c.name, :term)) AS score
  FROM "SERVICES" s
  JOIN "SERVICE_CATEGORIES" c ON c.category_id = s.category_id
 WHERE s.is_active
   AND c.is_active
   AND (
        s.name % :term
     OR s.name ILIKE :pattern
     OR s.description ILIKE :pattern
     OR c.name ILIKE :pattern
   )
 ORDER BY score DESC, s.sort_order, s.name
 LIMIT CAST(:limit AS int) OFFSET CAST(:offset AS int);