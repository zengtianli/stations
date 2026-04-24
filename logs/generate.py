#!/usr/bin/env python3
"""Logs — merged timeline of HANDOFF.md + plans + cc-evolution changes.

Replaces the old journal.tianlizeng.cloud + changelog.tianlizeng.cloud sites.

Scans:
  ~/Dev/HANDOFF.md                  (master latest session)
  ~/Dev/*/HANDOFF.md                (project-specific)
  ~/Work/*/HANDOFF.md
  ~/Work/bids/*/HANDOFF.md
  ~/.claude/plans/*.md
  ~/Dev/_archive/cc-evolution-20260419/changes.yaml   (CC self-evolution changelog)

Renders:
  site/index.html                   (dense timeline, default = all)
  site/d/<slug>.html                (detail page per entry)

Filter chips at top: 全部 / HANDOFF / Plan / CC 进化 + per-project chips.
"""
from __future__ import annotations

import html
import json
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

HOME = Path.home()
ROOT = Path(__file__).resolve().parent
SITE = ROOT / "site"
DETAIL_DIR = SITE / "d"

# Shared template loader — local override > devtools/lib/templates/
import sys as _sys
_sys.path.insert(0, str(HOME / "Dev" / "devtools" / "lib"))
from site_templates import load_site_templates  # noqa: E402
_TPL = load_site_templates(ROOT)
NAVBAR = _TPL["navbar"]
SITE_HEADER = _TPL["header"]
SITE_CONTENT_CSS = _TPL["css"]


@dataclass
class Entry:
    kind: str                # "handoff" | "plan" | "evolution"
    project: str             # "ops-console", "panan-rigid-2026", "(plan)", "(cc-evolution)"
    path: Path
    mtime: datetime
    title: str
    summary: str
    body_md: str
    slug: str = ""

    def as_json(self) -> dict:
        return {
            "kind": self.kind,
            "project": self.project,
            "path": str(self.path),
            "mtime": self.mtime.isoformat(),
            "title": self.title,
            "summary": self.summary,
            "slug": self.slug,
        }


def _is_symlink_to_master(p: Path) -> bool:
    master = HOME / "Dev" / "HANDOFF.md"
    try:
        return p.is_symlink() and p.resolve() == master.resolve()
    except Exception:
        return False


def _scan_handoffs() -> list[Entry]:
    candidates: list[Path] = []
    # Master + project-level HANDOFFs
    master = HOME / "Dev" / "HANDOFF.md"
    if master.exists():
        candidates.append(master)
    for root in [HOME / "Dev", HOME / "Work", HOME / "Work" / "bids"]:
        if not root.exists():
            continue
        for p in root.glob("*/HANDOFF.md"):
            if _is_symlink_to_master(p):
                continue
            candidates.append(p)

    entries: list[Entry] = []
    for p in candidates:
        try:
            body = p.read_text(encoding="utf-8", errors="replace")
            mtime = datetime.fromtimestamp(p.stat().st_mtime)
        except Exception:
            continue
        title, summary = _extract_title_summary(body)
        project = _project_of(p)
        slug = _slug(f"{project}-{mtime.strftime('%Y%m%d-%H%M')}")
        entries.append(
            Entry("handoff", project, p, mtime, title, summary, body, slug)
        )
    return entries


def _scan_evolution() -> list[Entry]:
    """Scan cc-evolution changes data — each change becomes a timeline entry.

    Source priority:
      1. data/cc-evolution-changes.yaml (snapshot inside this repo)
      2. ~/Dev/_archive/cc-evolution-20260419/changes.yaml (active source, pre-merge)
      3. ~/Dev/_archive/cc-evolution-*/changes.yaml (archived after merge)
    """
    candidates = [
        ROOT / "data" / "cc-evolution-changes.yaml",
        HOME / "Dev" / "cc-evolution" / "changes.yaml",
    ]
    archived_dir = HOME / "Dev" / "_archived"
    if archived_dir.exists():
        candidates.extend(sorted(archived_dir.glob("cc-evolution-*/changes.yaml"), reverse=True))
    yaml_path = next((p for p in candidates if p.exists()), None)
    if yaml_path is None:
        return []
    try:
        import yaml as _yaml
    except ImportError:
        return []
    try:
        data = _yaml.safe_load(yaml_path.read_text(encoding="utf-8")) or {}
    except Exception:
        return []
    base_mtime = datetime.fromtimestamp(yaml_path.stat().st_mtime)
    base_date_str = data.get("date", "")
    try:
        base_date = datetime.strptime(base_date_str, "%Y-%m-%d") if base_date_str else base_mtime
    except Exception:
        base_date = base_mtime

    phases = {p.get("id"): p.get("name", "") for p in (data.get("phases") or [])}
    entries: list[Entry] = []
    for ch in (data.get("changes") or []):
        cid = ch.get("id", 0)
        title = ch.get("title", f"change #{cid}")
        phase_name = phases.get(ch.get("phase"), "")
        repo = ch.get("repo", "")
        status = ch.get("status", "")
        before = (ch.get("before") or "").strip()
        after = (ch.get("after") or "").strip()
        why = (ch.get("why") or "").strip()

        body_lines = []
        if phase_name:
            body_lines.append(f"**Phase**: {phase_name}")
        if repo:
            body_lines.append(f"**Repo**: `{repo}`")
        if status:
            body_lines.append(f"**Status**: {status}")
        files = ch.get("files") or []
        if files:
            body_lines.append("**Files**:\n" + "\n".join(f"- `{f}`" for f in files))
        if before:
            body_lines.append("## Before\n\n" + before)
        if after:
            body_lines.append("## After\n\n" + after)
        if why:
            body_lines.append("## Why\n\n" + why)
        body_md = "\n\n".join(body_lines)

        summary_parts: list[str] = []
        if phase_name:
            summary_parts.append(phase_name)
        if status:
            summary_parts.append(status)
        if before:
            first = next((ln.strip() for ln in before.splitlines() if ln.strip()), "")
            if first:
                summary_parts.append(first[:80])
        summary = " · ".join(summary_parts)

        slug = _slug(f"cc-evolution-{cid:03d}")
        entries.append(Entry(
            "evolution", "(cc-evolution)", yaml_path,
            base_date, title, summary, body_md, slug,
        ))
    return entries


def _scan_plans() -> list[Entry]:
    plans_dir = HOME / ".claude" / "plans"
    if not plans_dir.exists():
        return []
    entries: list[Entry] = []
    for p in plans_dir.glob("*.md"):
        try:
            body = p.read_text(encoding="utf-8", errors="replace")
            mtime = datetime.fromtimestamp(p.stat().st_mtime)
        except Exception:
            continue
        title, summary = _extract_title_summary(body)
        slug = _slug(f"plan-{p.stem}")
        entries.append(Entry("plan", "(plan)", p, mtime, title, summary, body, slug))
    return entries


def _extract_title_summary(body: str) -> tuple[str, str]:
    # Title: first H1 or first non-empty line
    title = ""
    summary_lines: list[str] = []
    for line in body.splitlines():
        s = line.strip()
        if not s:
            continue
        if not title:
            title = re.sub(r"^#+\s*", "", s).strip()
            continue
        # Skip blockquote first-line fluff, then take first paragraph
        if s.startswith(">"):
            summary_lines.append(re.sub(r"^>\s*", "", s))
            continue
        if s.startswith("#"):
            break
        summary_lines.append(s)
        if len(summary_lines) >= 3:
            break
    summary = " ".join(summary_lines)[:240]
    return title or "(untitled)", summary


def _project_of(path: Path) -> str:
    parts = path.parts
    # ~/Dev/HANDOFF.md  → "master"
    if path == HOME / "Dev" / "HANDOFF.md":
        return "master"
    # ~/Dev/<name>/HANDOFF.md
    if len(parts) >= 2 and parts[-2] != "Dev":
        return parts[-2]
    return "(unknown)"


_SLUG_RE = re.compile(r"[^\w\-]+")


def _slug(s: str) -> str:
    return _SLUG_RE.sub("-", s.lower()).strip("-")[:80]


def _render_markdown_via_marked(md: str) -> str:
    """Client-side render: wrap raw md in a div, marked.js converts it."""
    return f'<div class="md-src" style="display:none">{html.escape(md)}</div><div class="md-out"></div>'


# ---------------------------------------------------------------------------
# HTML
# ---------------------------------------------------------------------------

BASE_CSS = """
* { box-sizing: border-box; }
body { margin: 0; font: 14px/1.55 -apple-system, BlinkMacSystemFont, 'PingFang SC', Helvetica, sans-serif;
       color: #1f2328; }
h1, h2, h3 { color: #1f2328; letter-spacing: -0.01em; }
h1 { font-size: 22px; margin: 0 0 4px; }
.subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }

/* logs 时间线：每个 row 用 .tlz-card.tlz-card--row（玻璃风格）+ 自身 grid 布局 */
.tlz-card.tlz-card--row {
  display: grid;
  grid-template-columns: 100px 140px 1fr 60px;
  gap: 16px;
  align-items: baseline;
  margin-bottom: 6px;
}
.tlz-card.tlz-card--row .date { color: #86868b; font-variant-numeric: tabular-nums; font-size: 12px; font-family: ui-monospace, monospace; }
.tlz-card.tlz-card--row .proj { font-weight: 600; color: #1f2328; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tlz-card.tlz-card--row .title { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tlz-card.tlz-card--row .kind { font-size: 10px; text-transform: uppercase; color: #9ca3af; text-align: right; letter-spacing: 0.05em; }
.timeline { display: flex; flex-direction: column; }
@media (max-width: 640px) {
  .tlz-card.tlz-card--row { grid-template-columns: 80px 1fr; }
  .tlz-card.tlz-card--row .proj { display: none; }
  .tlz-card.tlz-card--row .kind { display: none; }
}

.detail .md-out { font-size: 14px; line-height: 1.7; max-width: 900px; }
.detail .md-out h1 { font-size: 22px; margin: 24px 0 12px; }
.detail .md-out h2 { font-size: 18px; margin: 20px 0 10px; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 4px; }
.detail .md-out h3 { font-size: 16px; margin: 16px 0 8px; }
.detail .md-out p { margin: 8px 0; }
.detail .md-out code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; font: 13px ui-monospace, Menlo, monospace; }
.detail .md-out pre { background: #0d1117; color: #e6edf3; padding: 12px 16px; border-radius: 8px; overflow-x: auto; font: 12px/1.6 ui-monospace, Menlo, monospace; }
.detail .md-out pre code { background: transparent; padding: 0; color: inherit; }
.detail .md-out ul, .detail .md-out ol { margin: 8px 0; padding-left: 22px; }
.detail .md-out li { margin: 3px 0; }
.detail .md-out a { color: #0071E3; text-decoration: none; }
.detail .md-out a:hover { text-decoration: underline; }
.detail .md-out blockquote { border-left: 3px solid #0071E3; padding-left: 12px; color: #6b7280; margin: 8px 0; }
.detail .md-out table { border-collapse: collapse; margin: 12px 0; font-size: 13px; }
.detail .md-out th, .detail .md-out td { border: 1px solid rgba(0,0,0,0.1); padding: 6px 10px; text-align: left; }
.detail .md-out th { background: #f3f4f6; font-weight: 600; }

.meta-bar { color: #6b7280; font-size: 12px; margin-bottom: 20px; padding: 10px 14px; background: #fff; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05); }
.meta-bar .path { font-family: ui-monospace, Menlo, monospace; }
.back { display: inline-block; margin-bottom: 12px; color: #0071E3; text-decoration: none; font-size: 13px; }
.back:hover { text-decoration: underline; }
"""


def render_index(entries: list[Entry]) -> str:
    entries_sorted = sorted(entries, key=lambda e: e.mtime, reverse=True)
    projects = sorted({e.project for e in entries_sorted})
    kinds = sorted({e.kind for e in entries_sorted})

    rows_html = "\n".join(_row_html(e) for e in entries_sorted)
    projects_json = json.dumps(projects)

    return f"""<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Journal · 曾田力</title>
<style>{SITE_CONTENT_CSS}</style>
<style>{BASE_CSS}</style>
</head>
<body class="tlz-page">
{NAVBAR}
{SITE_HEADER}
<div class="tlz-container">
  <header class="tlz-stats-bar">
    <span><strong>{len(entries_sorted)}</strong> 条（按修改时间倒序）</span>
  </header>

  <div class="tlz-filters">
    <button class="tlz-btn active" data-filter="all">全部</button>
    <button class="tlz-btn" data-filter="kind:handoff">HANDOFF</button>
    <button class="tlz-btn" data-filter="kind:plan">Plan</button>
    <button class="tlz-btn" data-filter="kind:evolution">CC 进化</button>
  </div>
  <div class="tlz-filters">
    {"".join(f'<button class="tlz-btn" data-filter="proj:{p}">{p}</button>' for p in projects)}
  </div>

  <div class="timeline" id="timeline">
    {rows_html}
  </div>
</div>

<script>
document.querySelectorAll('.tlz-filters .tlz-btn').forEach(btn => {{
  btn.addEventListener('click', () => {{
    document.querySelectorAll('.tlz-filters .tlz-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    document.querySelectorAll('.tlz-card--row').forEach(row => {{
      let show = f === 'all';
      if (!show && f.startsWith('kind:')) show = row.dataset.kind === f.slice(5);
      if (!show && f.startsWith('proj:')) show = row.dataset.project === f.slice(5);
      row.style.display = show ? '' : 'none';
    }});
  }});
}});
</script>
</body></html>"""


def _row_html(e: Entry) -> str:
    date = e.mtime.strftime("%Y-%m-%d %H:%M")
    return (
        f'<a class="tlz-card tlz-card--row" href="d/{e.slug}.html" '
        f'data-kind="{e.kind}" data-project="{html.escape(e.project)}">'
        f'<span class="date">{date}</span>'
        f'<span class="proj">{html.escape(e.project)}</span>'
        f'<span class="title">{html.escape(e.title)}</span>'
        f'<span class="kind">{e.kind}</span>'
        f"</a>"
    )


def render_detail(e: Entry) -> str:
    return f"""<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(e.title)} · Journal</title>
<style>{BASE_CSS}</style>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body class="detail">
{NAVBAR}
<div class="wrap">
  <a class="back" href="../index.html">← Journal</a>
  <h1>{html.escape(e.title)}</h1>
  <div class="meta-bar">
    <span>{e.kind.upper()}</span> ·
    <span>{html.escape(e.project)}</span> ·
    <span>{e.mtime.strftime('%Y-%m-%d %H:%M')}</span> ·
    <span class="path">{html.escape(str(e.path).replace(str(HOME), '~'))}</span>
  </div>
  {_render_markdown_via_marked(e.body_md)}
</div>
<script>
document.querySelectorAll('.md-src').forEach(src => {{
  const out = src.nextElementSibling;
  out.innerHTML = marked.parse(src.textContent);
}});
</script>
</body></html>"""


def main():
    SITE.mkdir(exist_ok=True)
    DETAIL_DIR.mkdir(exist_ok=True)

    entries = _scan_handoffs() + _scan_plans() + _scan_evolution()

    (SITE / "index.html").write_text(render_index(entries), encoding="utf-8")

    for e in entries:
        (DETAIL_DIR / f"{e.slug}.html").write_text(render_detail(e), encoding="utf-8")

    # Export JSON for machine consumption (/api-like)
    (SITE / "entries.json").write_text(
        json.dumps([e.as_json() for e in entries], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"✓ Journal generated: {len(entries)} entries → site/index.html")


if __name__ == "__main__":
    main()
