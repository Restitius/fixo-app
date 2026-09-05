-- PRV.VER.DOC_TYPES.LIST -- acceptable verification documents catalogue (Provider Req Phase 5)
SELECT code, name, description, is_required, sort_order
  FROM "PROVIDER_DOC_TYPES"
 ORDER BY sort_order, code;
