#!/usr/bin/env python3
"""Replay unit manifest into page -> module -> dev history (dry/real)."""
from __future__ import annotations
import csv, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
TARGET = "refs/heads/rebuild/consistent-history"
PREFIX = "refs/rebuild"
def g(*a):
    p = subprocess.run(["git", *a], cwd=ROOT, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError("git fail: " + p.stderr.strip())
    return p.stdout.strip()
def tree_of(sha):
    return g("rev-parse", sha + "^{tree}")
def ctree(tree, parents, msg):
    c = ["commit-tree", tree]
    for par in parents:
        c += ["-p", par]
    p = subprocess.run(["git"] + c, cwd=ROOT, capture_output=True,
                       text=True, input=msg + "\n")
    if p.returncode != 0:
        raise RuntimeError("commit-tree fail: " + p.stderr.strip())
    return p.stdout.strip()
def loadm():
    rows = list(csv.DictReader(open(ROOT + "/rebuild/commit-map.tsv",
                                    encoding="utf-8"), delimiter="\t"))
    return {r["sha_full"].lower(): r for r in rows}
def parsem():
    units = []
    cur = None
    for line in open(ROOT + "/rebuild/unit-manifest.yaml", encoding="utf-8"):
        s = line.rstrip("\n")
        if s.startswith("- position:"):
            if cur:
                units.append(cur)
            cur = {"position": int(s.split(":")[1]), "sources": []}
        elif s.strip().startswith("id:"):
            cur["id"] = s.split("id:")[1].strip()
        elif s.strip().startswith("scope:"):
            cur["scope"] = s.split("scope:")[1].strip()
        elif s.strip().startswith("feature:"):
            cur["feature"] = s.split("feature:")[1].strip()
        elif s.strip().startswith("page_branch:"):
            cur["page_branch"] = s.split("page_branch:")[1].strip()
        elif s.strip().startswith("module_branch:"):
            cur["module_branch"] = s.split("module_branch:")[1].strip()
        elif s.strip().startswith("tag:"):
            cur["tag"] = s.split("tag:")[1].strip()
        elif s.strip().startswith("dev_merge:"):
            cur["dev_merge"] = s.split("dev_merge:")[1].strip()
        elif s.strip().startswith("- sha:"):
            cur["sources"].append({"sha": s.split("- sha:")[1].strip(),
                                   "short": "", "split": ""})
        elif s.strip().startswith("short:") and cur["sources"]:
            cur["sources"][-1]["short"] = s.split("short:")[1].strip()
        elif s.strip().startswith("split:") and cur["sources"]:
            cur["sources"][-1]["split"] = s.split("split:")[1].strip()
    if cur:
        units.append(cur)
    return units
def subj(m, sha, split):
    r = m[sha.lower()]
    b = r["new_subject"] or r["old_subject"]
    if r["status"] == "needs_split" and split:
        b = re.sub(r"^[a-z]+\([^)]*\)\s*:\s*", "", b)
        return "%s(%s): %s" % (r["new_type"] or "feat", split, b)
    return b
def exists(ref):
    p = subprocess.run(["git", "rev-parse", "--verify", ref], cwd=ROOT,
                       capture_output=True, text=True)
    return p.returncode == 0
def run(dry, limit, force):
    m = loadm()
    u = parsem()
    if limit:
        u = u[:limit]
    if not dry and exists(TARGET) and not force:
        raise SystemExit(
            "refusing to overwrite " + TARGET + " (pass --force to rebuild)")
    dev = ""
    print("replaying %d units (dry=%s)" % (len(u), dry))
    for x in u:
        page = ""
        for s in x["sources"]:
            t = tree_of(s["sha"])
            sj = subj(m, s["sha"], s["split"])
            og = g("log", "-1", "--format=%s", s["sha"])
            ms = "%s\n\nRebuilt from %s: %s" % (sj, s["short"] or s["sha"][:8], og)
            if dry:
                print("  [dry] %s: %s" % (x["page_branch"], sj))
                page = "dry"
                continue
            parents = [page] if page else ([dev] if dev else [])
            page = ctree(t, parents, ms)
        if dry:
            print("  [dry] %s <- page; dev <- module" % x["module_branch"])
            dev = "dry"
            continue
        mr = PREFIX + "/modules/" + x["module_branch"].replace("/", "_")
        if not exists(mr):
            g("update-ref", mr, page)
            mt = page
        else:
            mt = ctree(g("rev-parse", page + "^{tree}"),
                       [g("rev-parse", mr), page],
                       "Merge %s into %s (%s: %s)" % (x["page_branch"], x["module_branch"], x.get("scope", ""), x.get("feature", "")))
            g("update-ref", mr, mt)
        g("update-ref", PREFIX + "/pages/" + x["page_branch"].replace("/", "_"), page)
        g("update-ref", PREFIX + "/tags/" + x["tag"], mt)
        if dev:
            dev = ctree(g("rev-parse", mt + "^{tree}"), [dev, mt], x["dev_merge"])
        else:
            dev = ctree(g("rev-parse", mt + "^{tree}"), [mt], x["dev_merge"])
        print("  unit %3d %s: dev <- %s" % (x["position"], x["id"], dev[:8]))
    if dry:
        return
    g("update-ref", TARGET, dev)
    print("built %s at %s" % (TARGET, dev))
if __name__ == "__main__":
    _args = sys.argv[1:]
    if "--help" in _args or "-h" in _args:
        print("usage: rebuild_history.py [--dry-run] [--limit=N] [--force]")
        print("  --dry-run   print planned units without creating objects")
        print("  --limit=N   replay only the first N units")
        print("  --force     allow overwriting " + TARGET)
        raise SystemExit(0)
    _dry = "--dry-run" in _args
    _force = "--force" in _args
    _lim = 0
    for _a in _args:
        if _a.startswith("--limit="):
            _lim = int(_a.split("=", 1)[1])
    run(_dry, _lim, _force)
