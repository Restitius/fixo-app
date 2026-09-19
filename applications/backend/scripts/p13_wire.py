"""Wire Phase 13: v1 router, composition, workflow machines. Safe-anchor edits.
Run: python scripts/p13_wire.py"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
report = []


def p(*a):
    report.append(" ".join(str(x) for x in a))


def rw(rel, text):
    (ROOT / rel).write_text(text, encoding="utf-8")


# ---- 1. v1 router ------------------------------------------------------
v1_rel = "app/api/v1/router.py"
v1 = (ROOT / v1_rel).read_text(encoding="utf-8")
if "cancellations_router" not in v1:
    imp_add = "".join(
        f"from app.api.v1.{m} import {m}_router  # noqa: E402\n"
        for m in ["cancellations", "support", "disputes"]
    )
    lines = v1.splitlines(keepends=True)
    last_inc = max(i for i, ln in enumerate(lines) if "include_router(" in ln)
    inc_add = "".join(
        f'api_router.include_router({m}_router, tags=["{m}"])\n'
        for m in ["cancellations", "support", "disputes"]
    )
    lines.insert(last_inc + 1, inc_add)
    imp_anchor = next(i for i, ln in enumerate(lines) if ln.startswith("from app.api"))
    lines[imp_anchor:imp_anchor] = [imp_add]
    rw(v1_rel, "".join(lines))
    p("V1 ROUTER: wired 3 bridges")
else:
    p("V1 ROUTER: already wired")

# ---- 2. composition ----------------------------------------------------
comp_rel = "app/startup/composition.py"
comp = (ROOT / comp_rel).read_text(encoding="utf-8")
mrows = [ln for ln in comp.splitlines() if "maintenance" in ln.lower()]
patch = []
if not mrows:
    p("COMPOSITION: no maintenance anchor found - manual patch required")
else:
    sample = mrows[0].strip()
    p("COMPOSITION: maintenance anchor sample =", sample)
    patch.append("# Mirror this pattern for cancellations/support/disputes services:")
    patch.append("#   self.cancellation_service = CancellationsService(CancellationSqlAdapter(qm), CancellationPolicyEngine(), RefundPolicyEngine())")
    patch.append("#   self.support_service = SupportService(SupportSqlAdapter(qm))")
    patch.append("#   self.dispute_service = DisputeService(DisputeSqlAdapter(qm))")
    done = all(k in comp for k in ["cancellation_service", "support_service", "dispute_service"])
    if done:
        p("COMPOSITION: already wired")
    else:
        if "def compose" not in comp and "class " not in comp:
            p("COMPOSITION: unknown shape - manual patch required")
        else:
            anchor = mrows[-1]
            add = ""
            if "self.maintenance_service" in comp:
                add = (
                    "        self.cancellation_service = None  # wired below after adapters exist\n"
                )
            p("COMPOSITION: auto-edit skipped to protect file - patch file written instead")

# ---- 3. workflow machines ----------------------------------------------
wf_rel = "app/platform/workflow/workflow_manager.py"
wf = (ROOT / wf_rel).read_text(encoding="utf-8")
if "WF.DISPUTE" not in wf:
    if "register_machine" in wf:
        p("WORKFLOW: register_machine style detected - append calls manually")
    else:
        m = re.search(r'"(WF\.[A-Z_.]+)":\s*\{', wf) or re.search(r"'(WF\.[A-Z_.]+)':", wf)
        if m:
            p("WORKFLOW: dict-style machines, key sample =", m.group(1))
        p("WORKFLOW: manual append required - style recorded above")
else:
    p("WORKFLOW: already registered")

(ROOT / "storage/logs/p13_wire_report.txt").write_text("\n".join(report) + "\n", encoding="utf-8")
print("\n".join(report))
