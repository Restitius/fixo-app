-- CUS.PUBLIC.FAQS
SELECT faq_id, question, answer
  FROM "FAQS"
 WHERE is_public = TRUE
 ORDER BY sort_order;
