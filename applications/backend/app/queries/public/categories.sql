-- CUS.PUBLIC.CATEGORIES â€” active service categories for public browsing
SELECT category_id, code, name, description, icon
  FROM "SERVICE_CATEGORIES"
 WHERE is_active = TRUE
 ORDER BY sort_order;