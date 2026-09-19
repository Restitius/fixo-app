-- CUS.MATCH.CANDIDATE.ADD — persist one scored candidate (idempotent per pair).
INSERT INTO "MATCH_CANDIDATES" (request_id, provider_id, strategy, score, rank_pos, reasons)
VALUES (CAST(:request_id AS uuid), CAST(:provider_id AS uuid),
        :strategy, :score, :rank_pos, :reasons)
ON CONFLICT (request_id, provider_id) DO UPDATE
   SET strategy = EXCLUDED.strategy,
       score    = EXCLUDED.score,
       rank_pos = EXCLUDED.rank_pos,
       reasons  = EXCLUDED.reasons
RETURNING match_id, provider_id, score, rank_pos;