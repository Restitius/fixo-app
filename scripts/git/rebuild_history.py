#!/usr/bin/env python3
"""Replay unit manifest into page -> module -> dev history (dry/real)."""
from __future__ import annotations
import csv, os, re, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
TARGET = "refs/heads/rebuild/consistent-history"
PREFIX = "refs/rebuild"
EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"
sys.path.insert(0, os.path.join(ROOT, "rebuild"))
import scope_rules as R
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
    if r["status"] == "needs_split" and split:
        desc = re.sub(r"^[a-z]+\([^)]*\)\s*:\s*", "", r["old_subject"])
        return "%s(%s): %s" % (r["new_type"] or "feat", split, desc)
    ns = r["new_subject"]
    if not ns:
        raise SystemExit(
            "no new_subject for %s (status=%s); regenerate commit-map.tsv"
            % (sha[:10], r["status"]))
    return ns
def exists(ref):
    p = subprocess.run(["git", "rev-parse", "--verify", ref], cwd=ROOT,
                       capture_output=True, text=True)
    return p.returncode == 0
def surface_of(path):
    p = path.replace("\\", "/")
    if p.startswith(R.EXCLUDED_PREFIXES):
        return None
    for prefix, surface, _n in R.PATH_RULES:
        if p == prefix.rstrip("/") or p.startswith(prefix):
            return surface
    return None


def is_root(src):
    p = subprocess.run(["git", "rev-parse", "--verify", src + "^"],
                       cwd=ROOT, capture_output=True, text=True)
    return p.returncode != 0


def changes_of(src):
    if is_root(src):
        return [("A", ln.strip())
                for ln in g("ls-tree", "-r", "--name-only", src).splitlines()
                if ln.strip()]
    out = []
    raw = g("diff-tree", "-r", "--no-renames", "--name-status",
            src + "^", src)
    for ln in raw.splitlines():
        parts = ln.split("\t")
        if len(parts) >= 2:
            out.append((parts[0][:1], parts[-1]))
    return out


def blobs_of(src):
    d = {}
    for ln in g("ls-tree", "-r", src).splitlines():
        if "\t" not in ln:
            continue
        meta, path = ln.split("\t", 1)
        mode, typ, sha = meta.split()
        if typ == "blob":
            d[path] = (mode, sha)
    return d


def split_tree(base_tree, src, surface):
    """Tree = base_tree + the source commit's changes limited to one surface."""
    tmp = os.path.join(tempfile.gettempdir(), "fixo-rebuild-index")
    if os.path.exists(tmp):
        os.remove(tmp)
    env = dict(os.environ, GIT_INDEX_FILE=tmp)

    def rg(*a):
        p = subprocess.run(["git", *a], cwd=ROOT, capture_output=True,
                           text=True, env=env)
        if p.returncode != 0:
            raise RuntimeError("git fail: " + p.stderr.strip())
        return p.stdout

    rg("read-tree", base_tree)
    adds, dels = [], []
    blobs = blobs_of(src)
    for st, path in changes_of(src):
        if surface_of(path) != surface:
            continue
        if st == "D":
            dels.append(path)
        elif path in blobs:
            mode, sha = blobs[path]
            adds.append("--cacheinfo=%s,%s,%s" % (mode, sha, path))
    for i in range(0, len(adds), 200):
        rg("update-index", "--add", *adds[i:i + 200])
    for i in range(0, len(dels), 200):
        rg("update-index", "--force-remove", *dels[i:i + 200])
    tree = rg("write-tree").strip()
    os.remove(tmp)
    return tree, len(adds)


def run(dry, limit, force):
    m = loadm()
    u = parsem()
    if limit:
        u = u[:limit]
    stale = [r for r in subprocess.run(
        ["git", "for-each-ref", "--format=%(refname)", PREFIX],
        cwd=ROOT, capture_output=True, text=True).stdout.split() if r]
    if stale and not force:
        raise SystemExit(
            "found %d stale %s/* refs; pass --force to clean and rebuild"
            % (len(stale), PREFIX))
    if not dry and exists(TARGET) and not force:
        raise SystemExit(
            "refusing to overwrite " + TARGET + " (pass --force to rebuild)")
    if force and not dry:
        for r in stale:
            g("update-ref", "-d", r)
        if exists(TARGET):
            g("update-ref", "-d", TARGET)
    module_tips = {}
    dev = ""
    print("replaying %d units (dry=%s)" % (len(u), dry))
    for x in u:
        page = ""
        for s in x["sources"]:
            sj = subj(m, s["sha"], s["split"])
            og = g("log", "-1", "--format=%s", s["sha"])
            if dry:
                print("  [dry] %s: %s" % (x["page_branch"], sj))
                page = "dry"
                continue
            base = page if page else dev
            if s["split"]:
                bt = g("rev-parse", (base + "^{tree}") if base else EMPTY_TREE)
                t, kept = split_tree(bt, s["sha"], s["split"])
                if not kept:
                    raise SystemExit("split part %s (%s) kept 0 paths"
                                     % (s["sha"][:10], s["split"]))
            else:
                t = tree_of(s["sha"])
            ms = "%s\n\nRebuilt from %s: %s" % (sj, s["short"] or s["sha"][:8], og)
            parents = [page] if page else ([dev] if dev else [])
            page = ctree(t, parents, ms)
        if dry:
            print("  [dry] %s <- page; dev <- module" % x["module_branch"])
            dev = "dry"
            continue
        mtip = module_tips.get(x["module_branch"])
        if mtip is None:
            mt = page
        else:
            mt = ctree(g("rev-parse", page + "^{tree}"), [mtip, page],
                       "Merge %s into %s (%s: %s)" % (
                           x["page_branch"], x["module_branch"],
                           x.get("scope", ""), x.get("feature", "")))
        module_tips[x["module_branch"]] = mt
        g("update-ref", PREFIX + "/modules/" + x["module_branch"].replace("/", "_"), mt)
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
