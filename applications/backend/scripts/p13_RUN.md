# Phase 13 build sequence (compaction-proof runbook)

Every step prints its own results; fix only what a step complains about, then continue.

```bash
cd /c/www/FIXO-APP/applications/backend

# 1. Facts (tee'd to storage/logs/p13_facts.txt)
python scripts/p13_facts.py

# 2. Registry entries for the 14 P13 SQL files
python scripts/p13_registry.py

# 3. Adapters implementing the on-disk ports
python scripts/p13_adapters.py

# 4. Services + routers + bridges
python scripts/p13_api.py

# 5. Wiring (v1 router auto; composition/workflow patches reported)
python scripts/p13_wire.py
cat storage/logs/p13_wire_report.txt

# 6. Import sanity
python -c "import app.startup.composition; import app.main; print('IMPORTS OK')"

# 7. DB migration
python -m alembic upgrade head

# 8. Restart API (dev bind mounts)
docker restart fixo-api

# 9. Smoke test
python scripts/smoke_phase13.py

# 10. Full test suite
python -m pytest -q
```

Artifacts already on disk before this suite:
- app/queries/customers/{cancellations,support,disputes}/*.sql  (14 files)
- app/ports/persistence/{cancellation,support,dispute}_repository.py
- app/domains/cancellations/services/{cancellation_policy_engine,refund_policy_engine}.py
- app/shared/protection_errors.py
- migrations/versions/0015_phase13_protection.py

Known-manual leftovers (see p13_wire_report.txt):
- composition.py service wiring (auto-edit intentionally skipped to protect the file)
- workflow machines WF.DISPUTE.V1 / WF.SUPPORT.TICKET.V1 (style-dependent append)
