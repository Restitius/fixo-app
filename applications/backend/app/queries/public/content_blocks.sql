-- CUS.PUBLIC.CONTENT â€” landing page blocks approved for public display
SELECT block_code, title, body, sort_order
  FROM "CONTENT_BLOCKS"
 WHERE is_public = TRUE
 ORDER BY sort_order;