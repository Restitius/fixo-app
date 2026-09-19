-- CUS.ACCOUNT.CLOSURE.SCHEDULE
-- Uses SP_DELETE_ACCOUNT (inserts ACCOUNT_CLOSURES + soft-deletes customer)
SELECT * FROM SP_DELETE_ACCOUNT(CAST(:user_id AS uuid))
  AS t(closed, reversible);